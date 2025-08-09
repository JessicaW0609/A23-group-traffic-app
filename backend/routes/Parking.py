# backend/routes/parking.py
from flask import Blueprint, request, jsonify
from db.connect import get_db_connection

parking_bp = Blueprint("parking", __name__)

@parking_bp.route("/available-parking", methods=["POST"])                     # connect to the frontend

def available_parking():
    """
    Get available parking spots in a given location.
    Expected JSON: {"lat": ..., "lng": ...} or {"suburb": "..."}
    """
    data = request.get_json()
    lat = data.get("lat")
    lng = data.get("lng")
    suburb = data.get("suburb")                                              # get user input

    if not (suburb or (lat and lng)):
        return jsonify({"error": "Missing location data"}), 400
    
    """
    set up the database connection
    """

    conn = get_db_connection()

    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    """
    get the available parking spots in the database
    """

    try:
        with conn.cursor() as cursor:
            if suburb:
                # Street-name search using ERD tables. Treat "suburb" as a fuzzy street filter.
                sql = """
                WITH latest_status AS (
                    SELECT
                        pbs."Kerbside_ID",
                        pbs."Status_Description",
                        ROW_NUMBER() OVER (
                            PARTITION BY pbs."Kerbside_ID"
                            ORDER BY pbs."Status_Timestamp" DESC
                        ) AS rn
                    FROM "ParkingbaySensor" pbs
                )
                SELECT
                    COALESCE(rs."OnStreet", 'Unknown') AS street,
                    COUNT(DISTINCT si."Kerbside_ID") AS total_spots,
                    SUM(CASE WHEN ls."Status_Description" IN ('Unoccupied','Available','Free') THEN 1 ELSE 0 END) AS available_spots
                FROM "SensorInfo" si
                LEFT JOIN latest_status ls
                    ON ls."Kerbside_ID" = si."Kerbside_ID" AND ls.rn = 1
                LEFT JOIN "ParkingZone_Street" pzs
                    ON pzs."ParkingZone_ID" = si."ParkingZone_ID"
                LEFT JOIN "RoadSegment" rs
                    ON rs."RoadSegment_ID" = pzs."RoadSegment_ID"
                WHERE rs."OnStreet" ILIKE %s OR rs."RoadSegmentDescription" ILIKE %s
                GROUP BY street
                ORDER BY street;
                """
                cursor.execute(sql, (f"%{suburb}%", f"%{suburb}%"))
            else:
                # Radius search in meters using PostGIS
                sql = """
                WITH latest_status AS (
                    SELECT
                        pbs."Kerbside_ID",
                        pbs."Status_Description",
                        ROW_NUMBER() OVER (
                            PARTITION BY pbs."Kerbside_ID"
                            ORDER BY pbs."Status_Timestamp" DESC
                        ) AS rn
                    FROM "ParkingbaySensor" pbs
                )
                SELECT
                    COALESCE(rs."OnStreet", 'Unknown') AS street,
                    COUNT(DISTINCT si."Kerbside_ID") AS total_spots,
                    SUM(CASE WHEN ls."Status_Description" IN ('Unoccupied','Available','Free') THEN 1 ELSE 0 END) AS available_spots
                FROM "SensorInfo" si
                LEFT JOIN latest_status ls
                    ON ls."Kerbside_ID" = si."Kerbside_ID" AND ls.rn = 1
                LEFT JOIN "ParkingZone_Street" pzs
                    ON pzs."ParkingZone_ID" = si."ParkingZone_ID"
                LEFT JOIN "RoadSegment" rs
                    ON rs."RoadSegment_ID" = pzs."RoadSegment_ID"
                WHERE ST_DWithin(
                    geography(ST_SetSRID(ST_MakePoint(si."Longitude", si."Latitude"), 4326)),
                    geography(ST_SetSRID(ST_MakePoint(%s, %s), 4326)),
                    2000
                )
                GROUP BY street
                ORDER BY street;
                """
                cursor.execute(sql, (lng, lat))

            rows = cursor.fetchall()

            total_spots = sum(row["total_spots"] for row in rows)
            available_spots = sum(row["available_spots"] for row in rows)

            return jsonify({
                "total_spots": total_spots,
                "available_spots": available_spots,
                "distribution": rows
            })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    finally:
        conn.close()
