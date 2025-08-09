# backend/routes/Predict.py
from flask import Blueprint, request, jsonify
from model.motorPredict import predict_vehicles
import numpy as np
import traceback

predict_bp = Blueprint("predict", __name__)

def _normalize_years(payload):
    """
    Support 3 types of INPUT:
    1) {"year": 2026}
    2) {"years": [2025, 2026, 2030]}
    3) {"start": 2025, "end": 2030}  ->  [2025, 2026, ..., 2030]
    """
    if not isinstance(payload, dict):
        raise ValueError("Invalid JSON body")

    if "years" in payload:
        years = payload["years"]
        if not isinstance(years, (list, tuple)) or not years:
            raise ValueError("'years' must be a non-empty list")
        return [int(y) for y in years]

    if "year" in payload:
        return [int(payload["year"])]

    if "start" in payload and "end" in payload:
        start, end = int(payload["start"]), int(payload["end"])
        if start > end:
            raise ValueError("'start' must be <= 'end'")
        return list(range(start, end + 1))

    raise ValueError("Provide 'year', 'years', or ('start' and 'end').")

@predict_bp.route("/predict", methods=["POST"])
def predict():
    """
    request samples:
    - {"year": 2026}                    : only response one data
    - {"years": [2025, 2026, 2030]}     : response discrete datas
    - {"start": 2025, "end": 2030}      : response a continued years datas
    response samples:
    {
      "avgVehiclePerPerson": 0.85,
      "items": [
        {"Year": 2025, "PredictedPopulation": 5432100, "PredictedVehicles": 4627285},
        ...
      ]
    }
    """
    try:
        raw = request.get_data(as_text=True)
        ct  = request.content_type
        print(">> Content-Type:", ct, flush=True)
        print(">> Raw body:", raw, flush=True)

        data = request.get_json(silent=True) or {}
        print(">> Parsed JSON:", data, flush=True)

        years = _normalize_years(data)

        # Basic setting
        for y in years:
            if not (2000 <= y <= 2100):
                return jsonify({"error": f"Year out of range: {y}"}), 400

        # remove duplicates, sort，avoid re-compute
        years = sorted(set(years))

        forecast_df, avg_ratio = predict_vehicles(years)

        # DataFrame -> JSON
        items = [
            {
                "Year": int(row["Year"]),
                "PredictedPopulation": int(row["PredictedPopulation"]),
                "PredictedVehicles": int(row["PredictedVehicles"]),
            }
            for _, row in forecast_df.iterrows()
        ]

        return jsonify({
            "avgVehiclePerPerson": float(avg_ratio),
            "items": items
        }), 200

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}, 500