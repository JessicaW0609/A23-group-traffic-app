import os
import numpy as np
import pandas as pd
from joblib import load

_POP_MODEL = None

def _resolve_model_path():
    here = os.path.dirname(os.path.abspath(__file__))

    # from recent folder
    p0 = os.path.join(here, "linear_VIC.joblib")
    if os.path.exists(p0):
        return p0

    # if not in recent folder then add model/models
    parent = os.path.dirname(here)
    p1 = os.path.join(parent, "model", "linear_VIC.joblib")
    p2 = os.path.join(parent, "models", "linear_VIC.joblib")
    if os.path.exists(p1):
        return p1
    if os.path.exists(p2):
        return p2

    raise FileNotFoundError(f"Model not found. Tried:\n - {p0}\n - {p1}\n - {p2}")

def _get_model():
    global _POP_MODEL
    if _POP_MODEL is None:
        path = _resolve_model_path()
        print(f">> Loading model: {path}", flush=True)
        _POP_MODEL = load(path)
    return _POP_MODEL

def predict_vehicles(future_years):
    """
    Predict future vehicle counts using:
    1. A pre-trained VIC population model
    2. Fixed historical vehicle counts (2016–2020)
    3. Constant vehicles-per-person ratio

    Parameters
    ----------
    future_years : iterable of int
        Years to predict, e.g. range(2022, 2052) or [2025, 2030, 2040]

    Returns
    -------
    forecast_df : pd.DataFrame
        DataFrame with Year, PredictedPopulation, PredictedVehicles
    avg_ratio : float
        Average vehicles-per-person ratio used for prediction
    """
    # ==== Fixed settings ====
    hist_years = np.array([2016, 2017, 2018, 2019, 2020])
    hist_vehicles = np.array([209495, 214408, 236429, 215728, 188855], dtype=float)

    # Load population model
    pop_model = _get_model()

    # Reverse simulate historical population
    hist_pop = pop_model.predict(hist_years.reshape(-1, 1))

    # Compute average vehicle-per-person ratio
    ratio = hist_vehicles / hist_pop
    avg_ratio = ratio.mean()

    # Predict future
    future_years = np.asarray(list(future_years), dtype=int)
    future_pop = pop_model.predict(future_years.reshape(-1, 1))
    future_vehicles = future_pop * avg_ratio

    forecast_df = pd.DataFrame({
        "Year": future_years,
        "PredictedPopulation": future_pop.astype(int),
        "PredictedVehicles": future_vehicles.astype(int)
    }).sort_values("Year").reset_index(drop=True)

    return forecast_df, avg_ratio
