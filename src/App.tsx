import { useState } from 'react';
import { UploadCloud } from 'lucide-react';

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

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [vehicles, setVehicles] = useState<VehicleInfo[]>([]);
  const [darkMode, setDarkMode] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/api/detect', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch vehicle data');
      }

      const data: VehicleInfo[] = await response.json();
      setVehicles(data);
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar o arquivo. Verifique o backend.');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-start py-12 px-4 transition-colors duration-300 ${darkMode ? 'bg-black text-white' : 'bg-white text-gray-900'}`}>
      <div className="relative w-full mb-8">
        <h1 className="text-4xl font-bold text-center">Detecção de Placas Brasileiras</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="absolute top-0 right-0 mt-2 mr-4 px-4 py-2 rounded border border-gray-600 text-sm hover:bg-gray-800 hover:text-white transition"
        >
          {darkMode ? 'Modo Claro' : 'Modo Escuro'}
        </button>
      </div>

      <div className={`rounded-xl shadow-lg w-full max-w-xl p-6 flex flex-col sm:flex-row gap-4 items-center mb-10 ${darkMode ? 'bg-zinc-800 border border-zinc-700' : 'bg-gray-100 border border-gray-300'}`}>
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className={`text-sm w-full px-4 py-2 rounded ${darkMode ? 'bg-zinc-700 text-white border border-zinc-600' : 'bg-white text-gray-800 border border-gray-300'}`}
        />
        <button
          onClick={handleUpload}
          disabled={!file}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition px-6 py-2 rounded text-white flex items-center gap-2"
        >
          <UploadCloud size={18} /> Enviar
        </button>
      </div>

      {vehicles.length > 0 && (
        <div className="flex flex-col gap-8 w-full items-center">
          <h2 className="text-2xl font-bold mb-2">Veículos detectados:</h2>
          {vehicles.map((vehicle, idx) => (
            <div
              key={idx}
              className={`rounded-xl shadow-xl w-full max-w-2xl p-8 ${darkMode ? 'bg-zinc-800 border border-zinc-700' : 'bg-white border border-gray-300'}`}
            >
              <div className="flex items-center mb-6 gap-4">
                {vehicle.logo && (
                  <img src={vehicle.logo} alt="Marca" className="w-16 h-16 object-contain" />
                )}
                <div>
                  <h2 className="text-2xl font-semibold">
                    {vehicle.MARCA} {vehicle.MODELO}{' '}
                    <span className="text-gray-400">({vehicle.ano})</span>
                  </h2>
                  <p className="text-sm text-gray-400">Versão: {vehicle.VERSAO}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div><strong>Placa:</strong> {vehicle.placa}</div>
                <div><strong>Cor:</strong> {vehicle.cor}</div>
                <div><strong>Município:</strong> {vehicle.municipio}</div>
                <div><strong>Chassi:</strong> {vehicle.chassi}</div>
                <div><strong>Situação:</strong> {vehicle.situacao}</div>
                {vehicle.fipe?.dados?.length > 0 && (
                  <>
                    <div><strong>Modelo FIPE:</strong> {vehicle.fipe.dados[0].texto_modelo}</div>
                    <div><strong>Valor FIPE:</strong> {vehicle.fipe.dados[0].texto_valor}</div>
                    <div><strong>Referência:</strong> {vehicle.fipe.dados[0].mes_referencia}</div>
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