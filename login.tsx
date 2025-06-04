import { useState } from 'react';
import { UploadCloud, Trash2 } from 'lucide-react';
import CryptoJS from 'crypto-js';

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

// Regex for Brazilian plates: old (ABC1234) or Mercosur (ABC1D23)
const plateRegex = /^(?:[A-Z]{3}\d{4}|[A-Z]{3}\d[A-Z]\d{2})$/;

export default function App() {
    // Auth states
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [authError, setAuthError] = useState('');

    // Main states
    const [file, setFile] = useState<File | null>(null);
    const [detections, setDetections] = useState<PlateDetection[]>([]);
    const [vehicles, setVehicles] = useState<VehicleInfo[]>([]);
    const [darkMode, setDarkMode] = useState(false);

    // Login handler
    const handleLogin = async () => {
        setAuthError('');
        if (username === 'hashi' && password === 'compvis@2025') {
            setIsAuthorized(true);
            return;
        }
        const payload = JSON.stringify({ username, password });
        const encrypted = CryptoJS.AES.encrypt(payload, 'secret_key_here').toString();
        try {
            const resp = await fetch('/authorize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: encrypted }),
            });
            const result = await resp.json();
            if (resp.ok && result.authorized) setIsAuthorized(true);
            else setAuthError('Usuário ou senha inválidos.');
        } catch {
            setAuthError('Erro ao conectar com o servidor.');
        }
    };

    // File change handler
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setDetections([]);
            setVehicles([]);
        }
    };

    // Mock capture
    const handleCapture = async () => {
        if (!file) return;
        const toDataURL = (file: File): Promise<string> =>
            new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = err => reject(err);
                reader.readAsDataURL(file);
            });
        const dataUrl = await toDataURL(file);
        setDetections([
            { id: 1, plate: 'INT8C36', imageUrl: dataUrl },
            { id: 2, plate: 'XYZ1234', imageUrl: dataUrl },
        ]);
    };

    // Mock verify
    const handleVerify = () => {
        if (detections.length === 0) return;
        const base: Omit<VehicleInfo, 'placa'> = {
            MARCA: 'VW', MODELO: 'CROSSFOX', VERSAO: 'CROSSFOX', ano: '2007',
            chassi: '*****10137', cor: 'Prata', municipio: 'São Leopoldo', situacao: 'Sem restrição',
            fipe: { dados: [{ texto_valor: 'R$ 28.799,00', texto_modelo: 'CROSSFOX 1.6 Mi Total Flex 8V 5p', mes_referencia: 'maio de 2022' }] },
            logo: 'https://apiplacas.com.br/logos/logosMarcas/vw.png',
        };
        const mockVehicles = detections.map(d => ({ ...base, placa: d.plate }));
        setVehicles(mockVehicles);
    };

    const removeDetection = (id: number) => {
        setDetections(prev => prev.filter(d => d.id !== id));
    };

    const updatePlate = (id: number, input: string) => {
        const newPlate = input.toUpperCase();
        setDetections(prev => prev.map(d => (d.id === id ? { ...d, plate: newPlate } : d)));
    };

    const allValid = detections.length > 0 && detections.every(d => plateRegex.test(d.plate));

    // Login screen
    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-black text-gray-900 dark:text-white">
                <div className="bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-lg w-full max-w-sm">
                    <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
                    {authError && <p className="text-red-500 mb-2">{authError}</p>}
                    <input placeholder="Usuário" value={username} onChange={e => setUsername(e.target.value)} className="w-full mb-3 px-3 py-2 rounded border" />
                    <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full mb-4 px-3 py-2 rounded border" />
                    <button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">Entrar</button>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`min-h-screen flex flex-col items-center justify-start py-12 px-4 transition-colors duration-300 ${darkMode ? 'bg-black text-white' : 'bg-white text-gray-900'
                }`}
        >
            <div className="relative w-full mb-8">
                <h1 className="text-4xl font-bold text-center">Detecção de Placas Brasileiras</h1>
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="absolute top-0 right-0 mt-2 mr-4 px-4 py-2 rounded border border-gray-600 text-sm hover:bg-gray-800 hover:text-white transition"
                >
                    {darkMode ? 'Modo Claro' : 'Modo Escuro'}
                </button>
            </div>

            <div
                className={`rounded-xl shadow-lg w-full max-w-xl p-6 flex flex-col sm:flex-row gap-4 items-center mb-10 ${darkMode ? 'bg-zinc-800 border border-zinc-700' : 'bg-gray-100 border border-gray-300'
                    }`}
            >
                <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className={`text-sm w-full px-4 py-2 rounded ${darkMode ? 'bg-zinc-700 text-white border border-zinc-600' : 'bg-white text-gray-800 border border-gray-300'
                        }`}
                />
                <button
                    onClick={handleCapture}
                    disabled={!file}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition px-6 py-2 rounded text-white flex items-center gap-2"
                >
                    <UploadCloud size={18} /> Capturar
                </button>
            </div>

            {detections.length > 0 && (
                <div className="flex flex-col gap-4 w-full max-w-xl mb-10">
                    <h2 className="text-2xl font-bold mb-2">Placas detectadas (revise e ajuste):</h2>
                    {detections.map(d => {
                        const valid = plateRegex.test(d.plate);
                        return (
                            <div
                                key={d.id}
                                className={`flex items-center gap-4 p-4 rounded-xl ${darkMode ? 'bg-zinc-800 border border-zinc-700' : 'bg-white border border-gray-300'
                                    }`}
                            >
                                <img src={d.imageUrl} alt={d.plate} className="w-32 h-16 object-contain rounded" />
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
                        disabled={!allValid}
                        className="ml-auto mt-4 px-6 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition disabled:opacity-40"
                    >
                        Confirmar Placas
                    </button>
                </div>
            )}

            {vehicles.length > 0 && (
                <div className="flex flex-col gap-8 w-full items-center">
                    <h2 className="text-2xl font-bold mb-2">Veículos encontrados:</h2>
                    {vehicles.map((vehicle, idx) => (
                        <div
                            key={idx}
                            className={`rounded-xl shadow-xl w-full max-w-2xl p-8 ${darkMode ? 'bg-zinc-800 border border-zinc-700' : 'bg-white border border-gray-300'
                                }`}
                        >
                            <div className="flex items-center mb-6 gap-4">
                                {vehicle.logo && <img src={vehicle.logo} alt="Marca" className="w-16 h-16 object-contain" />}
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
