from flask import Blueprint, request, jsonify
from db.connect import get_db_connection

parking_bp = Blueprint("parking", __name__)

@parking_bp.route("/available-parking", methods=["POST"])

def available_parking():
    """
    Get available parking spots in a given location.
    Expected JSON: {"lat": ..., "lng": ...} or {"suburb": "..."}
    """
    data = request.get_json(silent=True) or {}
    lat = data.get("lat")
    lng = data.get("lng")
    suburb = data.get("suburb")

    
    if not (suburb or (lat is not None and lng is not None)):
        return jsonify({"error": "Missing location data"}), 400

    
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        with conn.cursor() as cursor:

            """use sql query to search for available spot basic on provided information ( suburb or coordinate )"""


            if suburb:
                
                sql = """
                WITH latest_status AS (
                    SELECT
                        pbs.kerbside_id,
                        pbs.status_description,
                        ROW_NUMBER() OVER (
                            PARTITION BY pbs.kerbside_id
                            ORDER BY pbs.status_timestamp DESC
                        ) AS rn
                    FROM parkingbaysensor pbs
                )
                SELECT
                    COALESCE(rs.onstreet, 'Unknown') AS street,
                    COUNT(DISTINCT si.kerbside_id) AS total_spots,
                    SUM(CASE
                        WHEN ls.status_description IN ('Unoccupied','Available','Free') THEN 1
                        ELSE 0
                    END) AS available_spots
                FROM sensorinfo si
                LEFT JOIN latest_status ls
                    ON ls.kerbside_id = si.kerbside_id AND ls.rn = 1
                LEFT JOIN parkingzone_street pzs
                    ON pzs.parkingzone_id = si.parkingzone_id
                LEFT JOIN roadsegment rs
                    ON rs.roadsegment_id = pzs.roadsegment_id
                WHERE rs.onstreet ILIKE %s
                   OR rs.roadsegmentdescription ILIKE %s
                GROUP BY street
                ORDER BY street;
                """
                cursor.execute(sql, (f"%{suburb}%", f"%{suburb}%"))
                
            else:
                
                sql = """
                WITH latest_status AS (
                    SELECT
                        pbs.kerbside_id,
                        pbs.status_description,
                        ROW_NUMBER() OVER (
                            PARTITION BY pbs.kerbside_id
                            ORDER BY pbs.status_timestamp DESC
                        ) AS rn
                    FROM parkingbaysensor pbs
                )
                SELECT
                    COALESCE(rs.onstreet, 'Unknown') AS street,
                    COUNT(DISTINCT si.kerbside_id) AS total_spots,
                    SUM(CASE
                        WHEN ls.status_description IN ('Unoccupied','Available','Free') THEN 1
                        ELSE 0
                    END) AS available_spots
                FROM sensorinfo si
                LEFT JOIN latest_status ls
                    ON ls.kerbside_id = si.kerbside_id AND ls.rn = 1
                LEFT JOIN parkingzone_street pzs
                    ON pzs.parkingzone_id = si.parkingzone_id
                LEFT JOIN roadsegment rs
                    ON rs.roadsegment_id = pzs.roadsegment_id
                WHERE ST_DWithin(
                    geography(ST_SetSRID(ST_MakePoint(si.longitude, si.latitude), 4326)),
                    geography(ST_SetSRID(ST_MakePoint(%s, %s), 4326)),
                    2000
                )
                GROUP BY street
                ORDER BY street;
                """
                
                cursor.execute(sql, (float(lng), float(lat)))

            rows = cursor.fetchall() or []

            
            total_spots = sum((r.get("total_spots") or 0) for r in rows)
            available_spots = sum((r.get("available_spots") or 0) for r in rows)

            return jsonify({
                "total_spots": int(total_spots),
                "available_spots": int(available_spots),
                "distribution": [
                    {
                        "street": r.get("street") or "Unknown",
                        "total_spots": int(r.get("total_spots") or 0),
                        "available_spots": int(r.get("available_spots") or 0),
                    }
                    for r in rows
                ],
            }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            conn.close()
        except Exception:
            pass
