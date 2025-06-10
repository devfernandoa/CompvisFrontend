import { useState } from 'react';
import { UploadCloud, Trash2 } from 'lucide-react';

interface PlateDetection {
  id: number;
  plate: string;
  imageUrl: string;
}

interface VehicleInfo {
  MARCA: string;
  MODELO: string;
  VERSAO: string;
  ano: string;
  chassi: string;
  cor: string;
  municipio: string;
  placa: string;
  situacao: string;
  fipe?: {
    dados: {
      texto_valor: string;
      texto_modelo: string;
      mes_referencia: string;
    }[];
  };
  logo?: string;
}

const plateRegex = /^(?:[A-Z]{3}\d{4}|[A-Z]{3}\d[A-Z]\d{2})$/;

// Base URL of your FastAPI backend (ensure VITE_API_BASE_URL is set)
const API_BASE = 'http://ec2-13-218-71-196.compute-1.amazonaws.com:8000'; // Replace with your actual backend URL

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [detections, setDetections] = useState<PlateDetection[]>([]);
  const [vehicles, setVehicles] = useState<VehicleInfo[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [loadingCapture, setLoadingCapture] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setDetections([]);
      setVehicles([]);
      setError(null);
    }
  };

  // Chama o endpoint /detect-plate/ do backend
  // in App.tsx

  // helper to read File → DataURL
  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const handleCapture = async () => {
    if (!file) return;
    setLoadingCapture(true);
    setError(null);

    try {
      const base64 = await toBase64(file);

      const isVideo = file.type.startsWith("video/");

      const response = await fetch(`${API_BASE}/detect-plate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });

      if (response.status === 404) {
        setDetections([]);
        setError('Nenhuma placa detectada.');
        return;
      }
      if (!response.ok) {
        const text = await response.text();
        console.error('Erro ao analisar a imagem:', response.status, text);
        setError('Erro ao analisar a imagem. Tente novamente.');
        return;
      }

      const data = await response.json();
      const platesObj = data.plates || {};
      const newDetections: PlateDetection[] = Object.entries(platesObj).map(
        ([plate, info], i) => {
          const b64 = (info as any).image;
          // if we sent a video, file.type === e.g. "video/mp4"
          const prefix = isVideo
            ? `data:${file.type};base64,`
            : `data:image/png;base64,`;
          return {
            id: i + 1,
            plate,
            imageUrl: `${prefix}${b64}`,
          };
        }
      );

      setDetections(newDetections);

    } catch (err) {
      console.error('Falha na requisição de captura:', err);
    } finally {
      setLoadingCapture(false);
    }
  };


  // Chama o endpoint /consulta-placa/{placa} do backend (com cache)
  const handleVerify = async () => {
    if (detections.length === 0) return;
    setLoadingVerify(true);

    try {
      const fetchedVehicles: VehicleInfo[] = [];

      for (const d of detections) {
        if (!plateRegex.test(d.plate)) continue;

        const resp = await fetch(`${API_BASE}/consulta-placa/${d.plate}`);
        if (!resp.ok) {
          console.error(`Erro na consulta da placa ${d.plate}:`, resp.statusText);
          continue;
        }

        const result = await resp.json();
        const vehicleData = result.data;

        const vehicleInfo: VehicleInfo = {
          MARCA: vehicleData.MARCA,
          MODELO: vehicleData.MODELO,
          VERSAO: vehicleData.VERSAO,
          ano: vehicleData.ano,
          chassi: vehicleData.chassi,
          cor: vehicleData.cor,
          municipio: vehicleData.municipio,
          situacao: vehicleData.situacao,
          placa: d.plate,
          fipe: vehicleData.fipe,
          logo: vehicleData.logo,
        };

        fetchedVehicles.push(vehicleInfo);
      }

      setVehicles(fetchedVehicles);
    } catch (err) {
      console.error('Falha na verificação dos veículos:', err);
    } finally {
      setLoadingVerify(false);
    }
  };

  const removeDetection = (id: number) => {
    setDetections(prev => prev.filter(d => d.id !== id));
  };

  const updatePlate = (id: number, newPlateRaw: string) => {
    const newPlate = newPlateRaw.toUpperCase();
    setDetections(prev =>
      prev.map(d => (d.id === id ? { ...d, plate: newPlate } : d))
    );
  };

  const allValid =
    detections.length > 0 &&
    detections.every(d => plateRegex.test(d.plate));

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-start py-12 px-4 transition-colors duration-300 ${darkMode ? 'bg-black text-white' : 'bg-white text-gray-900'
        }`}
    >
      <div className="relative w-full mb-8">
        <h1 className="text-4xl font-bold text-center">
          Detecção de Placas Brasileiras
        </h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="absolute top-0 right-0 mt-2 mr-4 px-4 py-2 rounded border border-gray-600 text-sm hover:bg-gray-800 hover:text-white transition"
        >
          {darkMode ? 'Modo Claro' : 'Modo Escuro'}
        </button>
      </div>

      <div
        className={`rounded-xl shadow-lg w-full max-w-xl p-6 flex flex-col sm:flex-row gap-4 items-center mb-10 ${darkMode
          ? 'bg-zinc-800 border border-zinc-700'
          : 'bg-gray-100 border border-gray-300'
          }`}
      >
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className={`text-sm w-full px-4 py-2 rounded ${darkMode
            ? 'bg-zinc-700 text-white border border-zinc-600'
            : 'bg-white text-gray-800 border border-gray-300'
            }`}
        />
        <button
          onClick={handleCapture}
          disabled={!file || loadingCapture}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition px-6 py-2 rounded text-white flex items-center gap-2"
        >
          <UploadCloud size={18} />
          {loadingCapture ? 'Capturando...' : 'Capturar'}
        </button>
      </div>

      {error && (
        <div className="w-full max-w-xl mb-4 p-4 rounded bg-red-100 border border-red-400 text-red-700">
          {error}
        </div>
      )}

      {detections.length > 0 && (
        <div className="flex flex-col gap-4 w-full max-w-xl mb-10">
          <h2 className="text-2xl font-bold mb-2">
            Placas detectadas (revise e ajuste):
          </h2>
          {detections.map(d => {
            const valid = plateRegex.test(d.plate);
            return (
              <div
                key={d.id}
                className={`flex items-center gap-4 p-4 rounded-xl ${darkMode
                  ? 'bg-zinc-800 border border-zinc-700'
                  : 'bg-white border border-gray-300'
                  }`}
              >
                <img
                  src={d.imageUrl}
                  alt={d.plate}
                  className="w-32 h-16 object-contain rounded"
                />
                <input
                  type="text"
                  placeholder="ABC1234 ou ABC1D23"
                  value={d.plate}
                  onChange={e => updatePlate(d.id, e.target.value)}
                  className={`flex-1 px-3 py-2 rounded border ${valid ? 'border-gray-300' : 'border-red-500'
                    } text-lg uppercase`}
                />
                <button
                  onClick={() => removeDetection(d.id)}
                  className="p-2 rounded hover:bg-red-600 hover:text-white transition"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            );
          })}
          <button
            onClick={handleVerify}
            disabled={!allValid || loadingVerify}
            className="ml-auto mt-4 px-6 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition disabled:opacity-40"
          >
            {loadingVerify ? 'Consultando...' : 'Confirmar Placas'}
          </button>
        </div>
      )}

      {vehicles.length > 0 && (
        <div className="flex flex-col gap-8 w-full items-center">
          <h2 className="text-2xl font-bold mb-2">Veículos encontrados:</h2>
          {vehicles.map((vehicle, idx) => (
            <div
              key={idx}
              className={`rounded-xl shadow-xl w-full max-w-2xl p-8 ${darkMode
                ? 'bg-zinc-800 border border-zinc-700'
                : 'bg-white border border-gray-300'
                }`}
            >
              <div className="flex items-center mb-6 gap-4">
                {vehicle.logo && (
                  <img
                    src={vehicle.logo}
                    alt="Marca"
                    className="w-16 h-16 object-contain"
                  />
                )}
                <div>
                  <h2 className="text-2xl font-semibold">
                    {vehicle.MARCA} {vehicle.MODELO}{' '}
                    <span className="text-gray-400">({vehicle.ano})</span>
                  </h2>
                  <p className="text-sm text-gray-400">
                    Versão: {vehicle.VERSAO}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <strong>Placa:</strong> {vehicle.placa}
                </div>
                <div>
                  <strong>Cor:</strong> {vehicle.cor}
                </div>
                <div>
                  <strong>Município:</strong> {vehicle.municipio}
                </div>
                <div>
                  <strong>Chassi:</strong> {vehicle.chassi}
                </div>
                <div>
                  <strong>Situação:</strong> {vehicle.situacao}
                </div>
                {vehicle.fipe?.dados?.length > 0 && (
                  <>
                    <div>
                      <strong>Modelo FIPE:</strong>{' '}
                      {vehicle.fipe.dados[0].texto_modelo}
                    </div>
                    <div>
                      <strong>Valor FIPE:</strong>{' '}
                      {vehicle.fipe.dados[0].texto_valor}
                    </div>
                    <div>
                      <strong>Referência:</strong>{' '}
                      {vehicle.fipe.dados[0].mes_referencia}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
