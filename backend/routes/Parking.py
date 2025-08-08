# backend/routes/parking.py
from flask import Blueprint, request, jsonify
from db.connect import get_db_connection

parking_bp = Blueprint("parking", __name__)

@parking_bp.route("/available-parking", methods=["POST"])

def available_parking():
    """
    Get available parking spots in a given location.
    Expected JSON: {"lat": ..., "lng": ...} or {"suburb": "..."}
    """
    data = request.get_json()
    lat = data.get("lat")
    lng = data.get("lng")
    suburb = data.get("suburb")

    if not (suburb or (lat and lng)):
        return jsonify({"error": "Missing location data"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        with conn.cursor() as cursor:
            if suburb:
                sql = """
                    SELECT street,
                           COUNT(*) AS total_spots,
                           SUM(CASE WHEN is_available = true THEN 1 ELSE 0 END) AS available_spots
                    FROM parking_spots
                    WHERE suburb = %s
                    GROUP BY street;
                """
                cursor.execute(sql, (suburb,))
            else:
                # Radius search in meters using PostGIS
                sql = """
                    SELECT street,
                           COUNT(*) AS total_spots,
                           SUM(CASE WHEN is_available = true THEN 1 ELSE 0 END) AS available_spots
                    FROM parking_spots
                    WHERE ST_DWithin(
                        geography(ST_MakePoint(longitude, latitude)),
                        geography(ST_MakePoint(%s, %s)),
                        2000
                    )
                    GROUP BY street;
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
