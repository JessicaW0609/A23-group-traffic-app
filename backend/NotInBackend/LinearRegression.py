import numpy as np
import pandas as pd
import re, os
from math import sqrt
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
from joblib import dump

FILE = r"E:\AutoSave\JupyterNotebook\monashAI_ipynb\5120GroupProject\RoughCleaned\resident population_RoughCleaned.xlsx"
YEAR_START, YEAR_END = 2001, 2021
STATE_CODE = 2        # VIC
VALID_STATE_CODE = 1  # NSW (optional validation)
N_FUTURE = 30         # Forecast next 30 years
OUT_DIR = "models"    # Directory to save models and forecast outputs

# ============ I/O Functions ============

def read_excel_multi(path):
    """
    Try reading the Excel file as a MultiIndex header (header=[0,1]).
    If it's not a MultiIndex, fall back to single header.
    """
    try:
        df = pd.read_excel(path, header=[0,1])
        if not isinstance(df.columns, pd.MultiIndex):
            raise ValueError("Not a MultiIndex header")
        return df
    except Exception:
        df = pd.read_excel(path)
        df.columns = [str(c).strip() for c in df.columns]
        return df

def find_st_code_col(cols):
    """
    Find the 'S/T code' column in either MultiIndex or single-level columns.
    Prefer matching the second level in MultiIndex.
    """
    if isinstance(cols, pd.MultiIndex):
        for tup in cols:
            if str(tup[1]).strip().lower() == "s/t code":
                return tup
        for tup in cols:
            if str(tup[0]).strip().lower() == "s/t code":
                return tup
        raise KeyError("Cannot find 'S/T code' column in MultiIndex header")
    else:
        for c in cols:
            if str(c).strip().lower() == "s/t code":
                return c
        raise KeyError("Cannot find 'S/T code' column in single header")

def get_year_subframe(df, y0=2001, y1=2021):
    """
    Extract only year columns from a DataFrame (2001–2021 by default).
    If the same year appears multiple times (e.g., 2021/no., 2021/no..1),
    merge them by summing across columns for that year.
    """
    if isinstance(df.columns, pd.MultiIndex):
        # Get columns where the first level is a year
        year_cols = [c for c in df.columns
                     if re.fullmatch(r"\d{4}", str(c[0]).strip() or "")
                     and y0 <= int(c[0]) <= y1]
        if not year_cols:
            raise AssertionError("No year columns found in MultiIndex header")
        Y = df.loc[:, year_cols].apply(pd.to_numeric, errors="coerce")
        # Merge duplicate year columns by summing over the first level
        Y = Y.groupby(level=0, axis=1).sum(min_count=1)
        Y.columns = [int(c) for c in Y.columns]
        return Y.sort_index(axis=1)
    else:
        # Single-level columns: match columns starting with the year
        year_cols = []
        for c in df.columns:
            m = re.match(r"^(\d{4})", str(c).strip())
            if m and y0 <= int(m.group(1)) <= y1:
                year_cols.append(c)
        if not year_cols:
            raise AssertionError("No year columns found in single header")
        Y = df.loc[:, year_cols].apply(pd.to_numeric, errors="coerce")
        # Map each column to its year, merge duplicates
        mapping = {c: int(re.match(r"^(\d{4})", str(c)).group(1)) for c in year_cols}
        Y = Y.groupby(mapping, axis=1).sum(min_count=1)
        return Y.sort_index(axis=1)

# ============ Time Series Building / Evaluation / Forecast / Save ============

def build_state_series(df, state_code):
    """
    Build an aggregated time series for a given state by summing population
    across all regions within that state for each year.
    """
    st_col = find_st_code_col(df.columns)
    sub = df.loc[df[st_col] == state_code].copy()
    Y = get_year_subframe(sub, YEAR_START, YEAR_END)
    s = Y.sum(axis=0, skipna=True)
    out = (pd.DataFrame({"year": s.index.astype(int), "pop": s.values.astype(float)})
           .sort_values("year").reset_index(drop=True))
    return out

def walk_forward_cv(series_df, min_train=8):
    """
    Perform walk-forward cross-validation for time series.
    Uses a linear regression model and reports RMSE and MAPE.
    """
    years = series_df["year"].values
    y = series_df["pop"].values
    preds, trues = [], []
    for i in range(min_train, len(years)):
        Xtr, ytr = years[:i].reshape(-1,1), y[:i]
        Xte, yte = years[i].reshape(-1,1), y[i]
        m = LinearRegression().fit(Xtr, ytr)
        preds.append(m.predict(Xte)[0]); trues.append(yte)
    rmse = sqrt(mean_squared_error(trues, preds))
    mape = float(np.mean(np.abs((np.array(trues)-np.array(preds))/np.array(trues)))*100)
    return rmse, mape

def fit_and_forecast(series_df, n_future):
    """
    Fit a linear regression model to the time series and forecast n_future years ahead.
    Returns the fitted model and the forecast DataFrame.
    """
    X, y = series_df[["year"]].values, series_df["pop"].values
    model = LinearRegression().fit(X, y)
    last_year = int(series_df["year"].max())
    fut_years = np.arange(last_year+1, last_year+1+n_future)
    preds = model.predict(fut_years.reshape(-1,1))
    return model, pd.DataFrame({"year": fut_years, "pred_pop": preds})

def save_model_and_forecast(model, forecast_df, state_tag):
    """
    Save the trained model and forecast results to disk.
    Model saved as joblib, forecast saved as CSV.
    """
    os.makedirs(OUT_DIR, exist_ok=True)
    model_path = os.path.join(OUT_DIR, f"linear_{state_tag}.joblib")
    dump(model, model_path)
    csv_path = os.path.join(OUT_DIR, f"forecast_{state_tag}.csv")
    forecast_df.to_csv(csv_path, index=False)
    print(f"[Saved] Model -> {model_path}")
    print(f"[Saved] Forecast -> {csv_path}")

# ============ Main Script ============

df = read_excel_multi(FILE)

# VIC (main target)
vic = build_state_series(df, STATE_CODE)
vic_rmse, vic_mape = walk_forward_cv(vic, min_train=8)
vic_model, vic_future = fit_and_forecast(vic, N_FUTURE)
print(f"[VIC] Walk-forward CV  RMSE={vic_rmse:,.0f}  MAPE={vic_mape:.2f}%")
print(vic_future.head(5))
save_model_and_forecast(vic_model, vic_future, "VIC")

# NSW (optional external validation)
# nsw = build_state_series(df, VALID_STATE_CODE)
# nsw_rmse, nsw_mape = walk_forward_cv(nsw, min_train=8)
# nsw_model, nsw_future = fit_and_forecast(nsw, N_FUTURE)
# print(f"[NSW] Walk-forward CV  RMSE={nsw_rmse:,.0f}  MAPE={nsw_mape:.2f}%")
# save_model_and_forecast(nsw_model, nsw_future, "NSW")
