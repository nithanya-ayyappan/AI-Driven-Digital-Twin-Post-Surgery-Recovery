import React, { useState, useEffect } from 'react';
import { Device, DeviceMessage, Patient, UserRole } from '../types';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import {
  Cpu,
  Wifi,
  Radio,
  Play,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  FileCode,
  ShieldCheck,
  Zap,
  Clock,
  Terminal,
  Activity
} from 'lucide-react';

interface DeviceIntegrationViewProps {
  devices: Device[];
  patients: Patient[];
  userRole: UserRole;
  onRefreshDevices: () => void;
  onNavigate: (view: any) => void;
}

export const DeviceIntegrationView: React.FC<DeviceIntegrationViewProps> = ({
  devices,
  patients,
  userRole,
  onRefreshDevices,
  onNavigate
}) => {
  const [messages, setMessages] = useState<DeviceMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // Simulation controls
  const [simDeviceId, setSimDeviceId] = useState('ESP32-VITAL-01');
  const [simPatientId, setSimPatientId] = useState('PT-2026-081');
  const [simCondition, setSimCondition] = useState('normal');

  const fetchMessages = () => {
    setLoadingMessages(true);
    fetch('/api/devices/messages')
      .then((res) => res.json())
      .then((data) => {
        setMessages(data);
        setLoadingMessages(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingMessages(false);
      });
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleRunSimulation = async () => {
    setSimulating(true);
    setSimulationResult(null);
    try {
      const res = await fetch('/api/devices/simulate-telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: simDeviceId,
          patient_id: simPatientId,
          condition: simCondition
        })
      });
      const data = await res.json();
      setSimulationResult(data);
      fetchMessages();
      onRefreshDevices();
    } catch (err: any) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      <DisclaimerBanner message="Software-ready IoT Gateway. Connect physical ESP32 microcontrollers or run simulated hardware streaming for validation." />

      {/* Header and Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-[#123B5D] flex items-center gap-2">
            <Cpu className="w-6 h-6 text-[#2A9D8F]" />
            ESP32 Sensor Gateway & Hardware Integration
          </h2>
          <p className="text-xs text-[#64748B]">
            Authenticated REST telemetry ingestion endpoint, device registry, and live sensor simulation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchMessages();
              onRefreshDevices();
            }}
            className="px-3 py-1.5 bg-white border border-[#DCE5EB] text-[#203040] text-xs font-semibold rounded-md hover:bg-[#F3F7FA] transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <RotateCw className="w-3.5 h-3.5" /> Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Registered Devices Cards */}
      <div>
        <h3 className="text-xs font-bold text-[#123B5D] uppercase tracking-wider mb-3">
          Registered Hardware Sensor Devices
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {devices.map((dev) => {
            const isOnline = dev.status === 'Connected';
            return (
              <div
                key={dev.id}
                className="bg-white border border-[#DCE5EB] rounded-lg p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded flex items-center justify-center ${
                      isOnline ? 'bg-[#2A9D8F]/15 text-[#2A9D8F]' : 'bg-slate-100 text-[#64748B]'
                    }`}>
                      <Wifi className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[#123B5D]">{dev.device_name}</div>
                      <div className="text-[10px] font-mono text-[#64748B]">{dev.id}</div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    isOnline ? 'bg-[#2A9D8F]/15 text-[#2A9D8F]' : 'bg-slate-200 text-[#64748B]'
                  }`}>
                    {dev.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-[#203040] pt-2 border-t border-[#DCE5EB]">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Assigned Patient:</span>
                    <strong className="text-[#123B5D]">{dev.assigned_patient_name || 'Unassigned'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Type:</span>
                    <span className="truncate max-w-[150px]">{dev.device_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Last Telemetry:</span>
                    <span className="font-mono text-[11px] text-[#64748B]">
                      {dev.last_seen ? new Date(dev.last_seen).toLocaleTimeString() : 'Never'}
                    </span>
                  </div>
                  {dev.battery_pct != null && (
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Battery Level:</span>
                      <span className="font-mono font-semibold">{dev.battery_pct}%</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live ESP32 Simulation Console & Ingestion Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Hardware Simulator */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-[#DCE5EB] rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE5EB]">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#2A9D8F]" />
                <h3 className="text-sm font-bold text-[#123B5D]">
                  Interactive ESP32 Telemetry Generator
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-[#E9A23B] bg-[#FFFBEB] px-2 py-0.5 rounded border border-[#FDE68A]">
                SIMULATED DATA GENERATOR
              </span>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Inject real-time physiological telemetry packets into the live REST endpoint (`POST /api/devices/ingest`) to test database persistence and alert rule triggers:
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#203040] mb-1">Select Hardware Device</label>
                <select
                  value={simDeviceId}
                  onChange={(e) => setSimDeviceId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#DCE5EB] rounded-md font-medium text-[#123B5D] bg-white focus:outline-none focus:border-[#123B5D]"
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.device_name} ({d.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#203040] mb-1">Target Patient Record</label>
                <select
                  value={simPatientId}
                  onChange={(e) => setSimPatientId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#DCE5EB] rounded-md font-medium text-[#123B5D] bg-white focus:outline-none focus:border-[#123B5D]"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.id}) · {p.surgery_type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#203040] mb-1">Physiological Test Scenario</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimCondition('normal')}
                    className={`p-2 rounded border text-left transition-colors ${
                      simCondition === 'normal'
                        ? 'bg-[#123B5D] text-white border-[#123B5D] font-bold'
                        : 'bg-[#F8FAFC] text-[#203040] border-[#DCE5EB]'
                    }`}
                  >
                    <div className="text-[11px]">Normal Vitals</div>
                    <div className="text-[10px] opacity-80">36.8°C / 72 bpm / 98%</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSimCondition('fever_spike')}
                    className={`p-2 rounded border text-left transition-colors ${
                      simCondition === 'fever_spike'
                        ? 'bg-[#C94C4C] text-white border-[#C94C4C] font-bold'
                        : 'bg-[#F8FAFC] text-[#203040] border-[#DCE5EB]'
                    }`}
                  >
                    <div className="text-[11px]">Fever Spike</div>
                    <div className="text-[10px] opacity-80">38.4°C / 98 bpm</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSimCondition('hypoxia')}
                    className={`p-2 rounded border text-left transition-colors ${
                      simCondition === 'hypoxia'
                        ? 'bg-[#E9A23B] text-white border-[#E9A23B] font-bold'
                        : 'bg-[#F8FAFC] text-[#203040] border-[#DCE5EB]'
                    }`}
                  >
                    <div className="text-[11px]">SpO2 Desat</div>
                    <div className="text-[10px] opacity-80">SpO2 91% (Hypoxia)</div>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={simulating}
                className="w-full py-2.5 bg-[#2A9D8F] text-white font-semibold rounded hover:bg-[#238276] transition-colors flex items-center justify-center gap-2 shadow-2xs mt-3 disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                {simulating ? 'Broadcasting Payload...' : 'Broadcast Simulated Telemetry Packet'}
              </button>

              {simulationResult && (
                <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded text-xs text-[#14532D] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2A9D8F]" />
                    <span>Packet Processed & Stored in SQLite!</span>
                  </div>
                  <div className="font-mono text-[11px]">
                    Temp: {simulationResult.simulatedPayload?.measurements?.temperature_c}°C · Pulse:{' '}
                    {simulationResult.simulatedPayload?.measurements?.pulse_bpm} bpm · SpO2:{' '}
                    {simulationResult.simulatedPayload?.measurements?.spo2_percent}%
                  </div>
                  {simulationResult.alertsTriggered?.length > 0 && (
                    <div className="text-[#C94C4C] font-bold text-[11px]">
                      Triggered {simulationResult.alertsTriggered.length} clinical alert(s)!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Raw Ingestion Message Log */}
          <div className="bg-white border border-[#DCE5EB] rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE5EB] mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#123B5D]" />
                <h3 className="text-sm font-bold text-[#123B5D]">Hardware Reception Stream</h3>
              </div>
              <span className="text-xs text-[#64748B] font-mono">Audit Buffer</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-xs text-[#64748B] text-center py-4">
                  No hardware messages recorded in log.
                </div>
              ) : (
                messages.slice(0, 10).map((msg) => (
                  <div
                    key={msg.id}
                    className="p-2 rounded bg-[#F8FAFC] border border-[#DCE5EB] text-[11px] font-mono"
                  >
                    <div className="flex items-center justify-between text-[#64748B] mb-1">
                      <span className="font-bold text-[#123B5D]">{msg.device_id}</span>
                      <span>{new Date(msg.received_at).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-[#203040] truncate">
                      {msg.raw_payload_json}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Hardware Specification & ESP32 C++ Firmware Example */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-[#DCE5EB] rounded-lg p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#DCE5EB]">
              <FileCode className="w-4 h-4 text-[#123B5D]" />
              <h3 className="text-sm font-bold text-[#123B5D]">ESP32 Ingestion API Specification</h3>
            </div>

            <div className="text-xs space-y-2 text-[#203040] leading-relaxed">
              <p>
                Physical microcontrollers (e.g., ESP32, ESP8266, Raspberry Pi Pico W) transmit vitals using JSON over authenticated HTTPS POST:
              </p>
              <div className="p-3 bg-[#123B5D] text-white rounded font-mono text-[11px] space-y-1">
                <div><strong>Endpoint:</strong> POST /api/devices/ingest</div>
                <div><strong>Header:</strong> Content-Type: application/json</div>
                <div><strong>Header:</strong> Authorization: Bearer &lt;DEVICE_API_KEY&gt;</div>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded border border-[#DCE5EB] font-mono text-[11px]">
                <div className="text-[#64748B] mb-1">// Standard Telemetry Schema:</div>
                <pre className="text-[#123B5D] overflow-x-auto">
{`{
  "device_id": "ESP32-VITAL-01",
  "patient_id": "PT-2026-081",
  "timestamp": "2026-11-01T14:30:00Z",
  "measurements": {
    "temperature_c": 36.8,
    "pulse_bpm": 74,
    "spo2_percent": 98,
    "systolic_bp": 120,
    "diastolic_bp": 80
  },
  "battery_pct": 92
}`}
                </pre>
              </div>
            </div>
          </div>

          {/* ESP32 Arduino C++ Code Snippet */}
          <div className="bg-white border border-[#DCE5EB] rounded-lg p-5 shadow-xs space-y-2">
            <h4 className="text-xs font-bold text-[#123B5D] uppercase tracking-wider">
              Arduino / ESP32 C++ Firmware Snippet
            </h4>
            <div className="p-3 bg-[#1E293B] text-slate-200 rounded font-mono text-[10px] overflow-x-auto max-h-64">
              <pre>
{`#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "HOSPITAL_WIFI";
const char* password = "SECURE_WPA2_KEY";
const char* serverUrl = "http://192.168.1.100:3000/api/devices/ingest";

void sendTelemetry(float tempC, int pulseBpm, int spo2) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<256> doc;
    doc["device_id"] = "ESP32-VITAL-01";
    doc["patient_id"] = "PT-2026-081";
    
    JsonObject measurements = doc.createNestedObject("measurements");
    measurements["temperature_c"] = tempC;
    measurements["pulse_bpm"] = pulseBpm;
    measurements["spo2_percent"] = spo2;

    String jsonString;
    serializeJson(doc, jsonString);

    int httpCode = http.POST(jsonString);
    if (httpCode > 0) {
      Serial.printf("Response: %d\\n", httpCode);
    }
    http.end();
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
