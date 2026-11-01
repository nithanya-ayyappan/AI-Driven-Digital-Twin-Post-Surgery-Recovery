"""
AI-Driven Digital Twin for Post-Surgery Recovery
Streamlit Application Entrypoint
"""

import streamlit as st
import pandas as pd
import numpy as np
import json
import os
import sqlite3
from datetime import datetime

# Database imports
from database.db import init_db, get_connection
from services.observation_service import record_observation, validate_observation
from services.trend_service import compute_recovery_trend
from services.device_service import validate_device_payload, generate_simulated_payload

# Initialize database
init_db()

st.set_page_config(
    page_title="AI-Driven Digital Twin for Post-Surgery Recovery",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Medical Theme Styling matching design system
st.markdown("""
<style>
    :root {
        --primary-navy: #123B5D;
        --secondary-teal: #2A9D8F;
        --page-bg: #F3F7FA;
    }
    .main {
        background-color: #F3F7FA;
    }
    .stMetric {
        background-color: white;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid #DCE5EB;
    }
    .stButton>button {
        background-color: #123B5D;
        color: white;
        border-radius: 6px;
    }
</style>
""", unsafe_allow_html=True)

# Session state initialization
if "role" not in st.session_state:
    st.session_state.role = "Clinician"
if "user_email" not in st.session_state:
    st.session_state.user_email = "clinician@hospital.org"

# Top Banner
st.info("ℹ️ Educational Prototype Notice: All records, vital series, and device telemetries shown are synthetic demonstrations. This system provides non-diagnostic clinical decision support.")

# Sidebar Navigation
st.sidebar.title("Digital Twin Recovery")
st.sidebar.caption("Post-Surgery Monitoring Platform")

# Role Switcher
st.session_state.role = st.sidebar.selectbox(
    "Active Role (Demo)",
    ["Clinician", "Administrator", "Patient"],
    index=0 if st.session_state.role == "Clinician" else (1 if st.session_state.role == "Administrator" else 2)
)

# Ordered Navigation items per project specification
nav_options = [
    "Dashboard",
    "Patients",
    "Digital Twin",
    "Recovery Timeline",
    "Health Monitoring",
    "AI Insights",
    "Alerts",
    "Reports",
    "Device Integration",
    "Settings"
]

# Role-based filtering
if st.session_state.role == "Patient":
    nav_options = ["Dashboard", "Digital Twin", "Recovery Timeline", "Health Monitoring", "Alerts", "Settings"]

selected_page = st.sidebar.radio("Navigation", nav_options)

st.sidebar.markdown("---")
st.sidebar.caption("Clinical Safety: Emergency symptoms mandate calling hospital services immediately.")

# ----------------- DB HELPERS -----------------
def load_patients():
    conn = get_connection()
    df = pd.read_sql_query("SELECT * FROM patients ORDER BY created_at DESC", conn)
    conn.close()
    return df

def load_observations(patient_id=None):
    conn = get_connection()
    query = "SELECT * FROM observations"
    if patient_id:
        query += f" WHERE patient_id = '{patient_id}'"
    query += " ORDER BY timestamp ASC"
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df

def load_alerts(patient_id=None):
    conn = get_connection()
    query = "SELECT * FROM alerts"
    if patient_id:
        query += f" WHERE patient_id = '{patient_id}'"
    query += " ORDER BY created_at DESC"
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df

# ----------------- 1. DASHBOARD -----------------
if selected_page == "Dashboard":
    st.header("Clinical Recovery Overview")
    st.caption("Real-time digital twin trajectories, physiological observations & active review flags")

    patients_df = load_patients()
    obs_df = load_observations()
    alerts_df = load_alerts()

    # Small KPI Summary Cards
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Enrolled Patients", len(patients_df), "Synthetic Cohort")
    col2.metric("Total Observations", len(obs_df), "Manual + Hardware")
    active_alerts = len(alerts_df[alerts_df["status"].isin(["New", "Under Review"])]) if not alerts_df.empty else 0
    col3.metric("Alerts for Review", active_alerts, "Clinical Review", delta_color="inverse")
    col4.metric("Active Gateways", "2 / 3", "ESP32 Connected")

    st.markdown("---")

    # Selected Patient Trajectory
    patient_list = patients_df["id"].tolist()
    if patient_list:
        selected_pt = st.selectbox("Select Patient for Dashboard View", patient_list, format_func=lambda pid: f"{patients_df[patients_df['id']==pid]['full_name'].values[0]} ({pid})")
        pt_obs = load_observations(selected_pt)

        if not pt_obs.empty:
            st.subheader(f"Vital Signs Trajectory: {selected_pt}")
            try:
                import plotly.graph_objects as go
                fig = go.Figure()
                fig.add_trace(go.Scatter(x=pt_obs["timestamp"], y=pt_obs["temperature_c"], name="Temperature (°C)", line=dict(color="#3978B8", width=2)))
                fig.add_trace(go.Scatter(x=pt_obs["timestamp"], y=pt_obs["pulse_bpm"], name="Pulse Rate (bpm)", line=dict(color="#2A9D8F", width=2), yaxis="y2"))
                fig.update_layout(
                    title="Longitudinal Vitals",
                    xaxis_title="Measurement Time",
                    yaxis=dict(title="Temperature (°C)", range=[35, 40]),
                    yaxis2=dict(title="Pulse Rate (bpm)", overlaying="y", side="right", range=[40, 130]),
                    height=300,
                    margin=dict(l=20, r=20, t=40, b=20)
                )
                st.plotly_chart(fig, use_container_width=True)
            except Exception as e:
                st.line_chart(pt_obs.set_index("timestamp")[["temperature_c", "pulse_bpm"]])
        else:
            st.info("No observation history recorded for this patient yet.")

# ----------------- 2. PATIENTS -----------------
elif selected_page == "Patients":
    st.header("Patient Recovery Registry")
    patients_df = load_patients()
    st.dataframe(patients_df, use_container_width=True)

# ----------------- 3. DIGITAL TWIN -----------------
elif selected_page == "Digital Twin":
    st.header("Patient Digital Twin Profile")
    patients_df = load_patients()
    if not patients_df.empty:
        selected_pt = st.selectbox("Select Digital Twin", patients_df["id"].tolist(), format_func=lambda pid: f"{patients_df[patients_df['id']==pid]['full_name'].values[0]} ({pid})")
        pt_row = patients_df[patients_df["id"] == selected_pt].iloc[0]
        pt_obs = load_observations(selected_pt)

        st.markdown(f"**Patient:** {pt_row['full_name']} | **Procedure:** {pt_row['surgery_type']} | **Date:** {pt_row['surgery_date']}")
        st.markdown(f"**Anatomical Surgical Site:** `{pt_row['surgical_site']}`")

        trend = compute_recovery_trend(pt_obs.to_dict(orient="records"))
        st.subheader("Recovery Trajectory Assessment")
        if trend["status"] == "DEVIATION_DETECTED":
            st.error(f"⚠️ **Physiological Deviation Flagged**: {trend['suggested_action']}")
        else:
            st.success("✅ **Expected Recovery Corridor Maintained**: Physiological measurements align with post-op norms.")
        st.caption(f"Confidence & Limitations: {trend['limitations']}")

        if not pt_obs.empty:
            st.subheader("Observation History")
            st.dataframe(pt_obs[["timestamp", "temperature_c", "pulse_bpm", "spo2_percent", "pain_score", "data_source"]], use_container_width=True)

# ----------------- 4. RECOVERY TIMELINE -----------------
elif selected_page == "Recovery Timeline":
    st.header("Chronological Recovery Timeline")
    patients_df = load_patients()
    selected_pt = st.selectbox("Select Patient", patients_df["id"].tolist())
    pt_obs = load_observations(selected_pt)
    st.markdown("Chronological post-operative timeline. Gaps in monitoring are preserved.")
    for idx, row in pt_obs.iterrows():
        st.markdown(f"🕒 **{row['timestamp']}** — Vitals: {row['temperature_c']}°C, {row['pulse_bpm']} bpm, Pain: {row['pain_score']}/10 ({row['data_source']})")

# ----------------- 5. HEALTH MONITORING -----------------
elif selected_page == "Health Monitoring":
    st.header("Record Clinical Observation")
    patients_df = load_patients()
    with st.form("observation_form"):
        target_pt = st.selectbox("Patient", patients_df["id"].tolist())
        temp_val = st.number_input("Body Temperature (°C)", min_value=33.0, max_value=43.0, value=36.8, step=0.1)
        pulse_val = st.number_input("Pulse Rate (bpm)", min_value=35, max_value=220, value=74)
        spo2_val = st.number_input("SpO2 Percentage (%)", min_value=60, max_value=100, value=98)
        pain_val = st.slider("Pain Score (0-10)", min_value=0, max_value=10, value=3)
        notes = st.text_area("Clinician / Observer Notes", "Normal post-op recovery check.")
        submitted = st.form_submit_button("Submit Observation")

        if submitted:
            success, obs_id, alerts = record_observation({
                "patient_id": target_pt,
                "temperature_c": temp_val,
                "pulse_bpm": pulse_val,
                "spo2_percent": spo2_val,
                "pain_score": pain_val,
                "clinician_notes": notes,
                "data_source": "MANUAL_CLINICIAN",
                "recorded_by": st.session_state.user_email
            })
            if success:
                st.success(f"Observation recorded successfully! ID: {obs_id}")
                if alerts:
                    st.warning(f"Triggered {len(alerts)} clinical alert(s) for review!")
            else:
                st.error(f"Validation error: {obs_id}")

# ----------------- 6. AI INSIGHTS -----------------
elif selected_page == "AI Insights":
    st.header("Explainable AI Insights & Decision Support")
    patients_df = load_patients()
    selected_pt = st.selectbox("Select Patient", patients_df["id"].tolist())
    pt_obs = load_observations(selected_pt)
    trend = compute_recovery_trend(pt_obs.to_dict(orient="records"))
    st.json(trend)

# ----------------- 7. ALERTS -----------------
elif selected_page == "Alerts":
    st.header("Clinical Alert Management")
    alerts_df = load_alerts()
    st.dataframe(alerts_df, use_container_width=True)

# ----------------- 8. REPORTS -----------------
elif selected_page == "Reports":
    st.header("Patient Recovery Summary Dossier")
    patients_df = load_patients()
    selected_pt = st.selectbox("Select Patient for Report", patients_df["id"].tolist())
    st.markdown("Standardized discharge report ready for clinical print and review.")
    st.info("Use the Web App Print feature on the interactive React portal for full styled PDF rendering.")

# ----------------- 9. DEVICE INTEGRATION -----------------
elif selected_page == "Device Integration":
    st.header("ESP32 Sensor Gateway")
    st.markdown("Hardware Ingestion Interface and Simulation Rig.")
    st.code("""
// ESP32 Standard Ingestion Payload
{
  "device_id": "ESP32-VITAL-01",
  "patient_id": "PT-2026-081",
  "measurements": {
    "temperature_c": 36.8,
    "pulse_bpm": 74,
    "spo2_percent": 98
  }
}
    """, language="json")

# ----------------- 10. SETTINGS -----------------
elif selected_page == "Settings":
    st.header("Platform Settings & Governance")
    st.markdown(f"**Current User:** {st.session_state.user_email} ({st.session_state.role})")
    st.markdown("**Storage Engine:** SQLite (digital_twin.db)")
    if st.button("Re-Seed Sample Data"):
        init_db()
        st.success("Database re-seeded with pristine fictional patients.")
