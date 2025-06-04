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

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [detections, setDetections] = useState<PlateDetection[]>([]);
  const [vehicles, setVehicles] = useState<VehicleInfo[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [loadingCapture, setLoadingCapture] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);

  const TOKEN = import.meta.env.VITE_WDAPI_TOKEN;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setDetections([]);
      setVehicles([]);
    }
  };

  // Substitui o mock por uma chamada real a POST my-url/analyze
  const handleCapture = async () => {
    if (!file) return;
    setLoadingCapture(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('my-url/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        console.error('Erro ao analisar a imagem:', response.statusText);
        setLoadingCapture(false);
        return;
      }

      const data = await response.json();
      // Esperamos que o JSON tenha o formato:
      // {
      //   message: "Plates detected successfully.",
      //   plates: {
      //     "ABC1234": { image: "<base64>", frequency: ..., frame: ..., image_resolution: ... },
      //     "XYZ1A23": { ... },
      //     ...
      //   }
      // }

      const platesObj = data.plates || {};
      const newDetections: PlateDetection[] = Object.entries(platesObj).map(
        ([plate, info], index) => ({
          id: index + 1,
          plate: plate,
          imageUrl: `data:image/png;base64,${info.image}`,
        })
      );

      setDetections(newDetections);
    } catch (err) {
      console.error('Falha na requisição de captura:', err);
    } finally {
      setLoadingCapture(false);
    }
  };

  // Envia cada placa válida para a API externa e preenche informações de veículo
  const handleVerify = async () => {
    if (detections.length === 0) return;
    setLoadingVerify(true);

    try {
      const fetchedVehicles: VehicleInfo[] = [];

      for (const d of detections) {
        if (!plateRegex.test(d.plate)) {
          continue;
        }

        const resp = await fetch(
          `https://wdapi2.com.br/consulta/${d.plate}/${TOKEN}`
        );
        if (!resp.ok) {
          console.error(`Erro na consulta da placa ${d.plate}:`, resp.statusText);
          continue;
        }
        const vehicleData = await resp.json();

        // Supondo que a resposta JSON já tenha a mesma estrutura de VehicleInfo,
        // basta atribuir 'placa' manualmente (caso não venha no payload).
        // Ajuste conforme o formato real da resposta da API.
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
    detections.length > 0 && detections.every(d => plateRegex.test(d.plate));

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
