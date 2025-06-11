import { useState } from 'react';
import { UploadCloud, Trash2 } from 'lucide-react';

interface PlateDetection {
  id: number;
  plate: string;
  imageUrl: string;
}

interface VehicleInfo {
  id: number;
  plate: string;
  MARCA?: string;
  MODELO?: string;
  VERSAO?: string;
  ano?: string;
  chassi?: string;
  cor?: string;
  municipio?: string;
  situacao?: string;
  fipe?: {
    dados?: {
      texto_valor: string;
      texto_modelo: string;
      mes_referencia: string;
    }[];
  };
  logo?: string;
  error: boolean;
}

const plateRegex = /^(?:[A-Z]{3}\d{4}|[A-Z]{3}\d[A-Z]\d{2})$/;
const API_BASE = 'https://api.fernandoa.dev';

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
    setDetections([]);
    setVehicles([]);
    setError(null);

    try {
      const base64 = await toBase64(file);
      const isVideo = file.type.startsWith('video/');
      const response = await fetch(`${API_BASE}/detect-plate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });

      if (response.status === 404) {
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
      const newDetections = Object.entries(platesObj).map(([plate, info], i) => ({
        id: i + 1,
        plate,
        imageUrl: isVideo
          ? `data:${file.type};base64,${(info as any).image}`
          : `data:image/png;base64,${(info as any).image}`,
      }));

      setDetections(newDetections);
    } catch (err) {
      console.error('Falha na requisição de captura:', err);
      setError('Erro de rede ao capturar placas.');
    } finally {
      setLoadingCapture(false);
    }
  };

  const handleVerify = async () => {
    if (!detections.length) return;
    setLoadingVerify(true);

    const results = await Promise.all(
      detections.map(async (d) => {
        if (!plateRegex.test(d.plate)) {
          return { id: d.id, plate: d.plate, error: true } as VehicleInfo;
        }
        try {
          const resp = await fetch(`${API_BASE}/consulta-placa/${d.plate}`);
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const json = await resp.json();
          const vehicleData = json.data;
          if (!vehicleData.MARCA) {
            return { id: d.id, plate: d.plate, error: true } as VehicleInfo;
          }
          return {
            id: d.id,
            plate: d.plate,
            MARCA: vehicleData.MARCA,
            MODELO: vehicleData.MODELO,
            VERSAO: vehicleData.VERSAO,
            ano: vehicleData.ano,
            chassi: vehicleData.chassi,
            cor: vehicleData.cor,
            municipio: vehicleData.municipio,
            situacao: vehicleData.situacao,
            fipe: vehicleData.fipe,
            logo: vehicleData.logo,
            error: false,
          } as VehicleInfo;
        } catch {
          return { id: d.id, plate: d.plate, error: true } as VehicleInfo;
        }
      })
    );

    setVehicles(results);
    setLoadingVerify(false);
  };

  const removeDetection = (id: number) => {
    setDetections((prev) => prev.filter((d) => d.id !== id));
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  };

  const updatePlate = (id: number, newPlateRaw: string) => {
    const newPlate = newPlateRaw.toUpperCase();
    setDetections((prev) =>
      prev.map((d) => (d.id === id ? { ...d, plate: newPlate } : d))
    );
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  };

  const allValid = detections.length > 0 && detections.every((d) => plateRegex.test(d.plate));

  return (
    <div className={`min-h-screen flex flex-col items-center justify-start py-12 px-4 transition-colors duration-300 ${darkMode ? 'bg-black text-white' : 'bg-white text-gray-900'
      }`}>
      <div className="relative w-full mb-8">
        <h1 className="text-4xl font-bold text-center">Detecção de Placas Brasileiras</h1>
        <button
          onClick={() => setDarkMode((m) => !m)}
          className="absolute top-0 right-0 mt-2 mr-4 px-4 py-2 rounded border border-gray-600 text-sm hover:bg-gray-800 hover:text-white transition"
        >
          {darkMode ? 'Modo Claro' : 'Modo Escuro'}
        </button>
      </div>

      <div className={`rounded-xl shadow-lg w-full max-w-xl p-6 flex flex-col sm:flex-row gap-4 items-center mb-10 ${darkMode ? 'bg-zinc-800 border border-zinc-700' : 'bg-gray-100 border border-gray-300'
        }`}>
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className={`text-sm w-full px-4 py-2 rounded ${darkMode ? 'bg-zinc-700 text-white border border-zinc-600' : 'bg-white text-gray-800 border border-gray-300'
            }`} />
        <button
          onClick={handleCapture}
          disabled={!file || loadingCapture}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition px-6 py-2 rounded text-white flex items-center gap-2"
        >
          <UploadCloud size={18} />
          {loadingCapture ? 'Capturando...' : 'Capturar'}
        </button>
      </div>

      {error && <div className="w-full max-w-xl mb-4 p-4 rounded bg-red-100 border border-red-400 text-red-700">{error}</div>}

      {detections.length > 0 && (
        <div className="flex flex-col gap-4 w-full max-w-xl mb-10">
          <h2 className="text-2xl font-bold mb-2">Placas detectadas (revise e ajuste):</h2>
          {detections.map((d) => {
            const valid = plateRegex.test(d.plate);
            const semanticInvalid = vehicles.find((v) => v.id === d.id)?.error;
            return (
              <div
                key={d.id}
                className={`flex items-center gap-4 p-4 rounded-xl ${darkMode ? 'bg-zinc-800 border border-zinc-700' : 'bg-white border border-gray-300'
                  }`}>
                <img src={d.imageUrl} alt={d.plate} className="w-32 h-16 object-contain rounded" />
                <input
                  type="text"
                  placeholder="ABC1234 ou ABC1D23"
                  value={d.plate}
                  onChange={(e) => updatePlate(d.id, e.target.value)}
                  className={`flex-1 px-3 py-2 rounded border ${semanticInvalid ? 'border-red-500' : valid ? 'border-gray-300' : 'border-red-500'
                    } text-lg uppercase`} />
                <button onClick={() => removeDetection(d.id)} className="p-2 rounded hover:bg-red-600 hover:text-white transition">
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
          {vehicles.map((v) => {
            const dados = v.fipe?.dados ?? [];
            return v.error ? (
              <div key={v.id} className="rounded-xl shadow-xl w-full max-w-2xl p-8 bg-red-100 border border-red-400 text-red-700">
                <p>Veículo não encontrado para placa {v.plate}.</p>
              </div>
            ) : (
              <div
                key={v.id}
                className={`rounded-xl shadow-xl w-full max-w-2xl p-8 ${darkMode ? 'bg-zinc-800 border border-zinc-700' : 'bg-white border border-gray-300'
                  }`}>
                <div className="flex items-center mb-6 gap-4">
                  {v.logo && <img src={v.logo} alt="Marca" className="w-16 h-16 object-contain" />}
                  <div>
                    <h2 className="text-2xl font-semibold">
                      {v.MARCA} {v.MODELO} <span className="text-gray-400">({v.ano})</span>
                    </h2>
                    <p className="text-sm text-gray-400">Versão: {v.VERSAO}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm	grid-cols-2 gap-y-4 gap-x-6 text-sm">
                  <div><strong>Placa:</strong> {v.plate}</div>
                  <div><strong>Cor:</strong> {v.cor}</div>
                  <div><strong>Município:</strong> {v.municipio}</div>
                  <div><strong>Chassi:</strong> {v.chassi}</div>
                  <div><strong>Situação:</strong> {v.situacao}</div>
                  {dados.length > 0 && (
                    <>
                      <div><strong>Modelo FIPE:</strong> {dados[0].texto_modelo}</div>
                      <div><strong>Valor FIPE:</strong> {dados[0].texto_valor}</div>
                      <div><strong>Referência:</strong> {dados[0].mes_referencia}</div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
