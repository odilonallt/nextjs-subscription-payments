'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function ProjectEstimator() {
  const supabase = createClient();
  const [surface, setSurface] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const [licenseCode, setLicenseCode] = useState('');
  const [status, setStatus] = useState('');

  // 1. Charger l'utilisateur et ses droits
  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setUser({ ...user, ...profile });
      }
    };
    getData();
  }, []);

  // 2. Logique de calcul + Compteur d'essais
  const handleEstimate = async () => {
    if (!user.est_premium && user.compteur_essais >= 2) {
      setStatus("Limite gratuite atteinte. Achetez un code pour continuer !");
      return;
    }

    const estimation = surface * 1500; // Exemple : 1500€ le m²
    setResult(estimation);

    if (!user.est_premium) {
      const nouveauCompteur = user.compteur_essais + 1;
      await supabase.from('profiles').update({ compteur_essais: nouveauCompteur }).eq('id', user.id);
      setUser({ ...user, compteur_essais: nouveauCompteur });
    }
  };

  // 3. Validation du code complexe
  const handleActivate = async () => {
    const { data: licence } = await supabase.from('licences')
      .select('*').eq('code_secret', licenseCode).eq('est_utilise', false).single();

    if (licence) {
      await supabase.from('profiles').update({ est_premium: true }).eq('id', user.id);
      await supabase.from('licences').update({ est_utilise: true }).eq('code_secret', licenseCode);
      setUser({ ...user, est_premium: true });
      setStatus("✅ Accès Illimité Activé !");
    } else {
      setStatus("❌ Code invalide.");
    }
  };

  if (!user) return <div className="p-10 text-center">Veuillez vous connecter...</div>;

  return (
    <div className="max-w-md mx-auto p-8 bg-white shadow-xl rounded-xl mt-10">
      <h1 className="text-2xl font-bold mb-4 text-black">Estimateur de Projet</h1>
      
      <input type="number" placeholder="Surface en m²" onChange={(e) => setSurface(Number(e.target.value))} className="w-full border p-2 mb-4 text-black" />
      <button onClick={handleEstimate} className="w-full bg-black text-white p-2 rounded mb-4">Calculer mon projet</button>

      {result && <div className="p-4 bg-green-100 text-green-800 rounded mb-4 text-center">Estimation : {result}€</div>}

      {user.compteur_essais >= 2 && !user.est_premium && (
        <div className="border-t pt-4 mt-4">
          <p className="text-red-500 text-sm mb-4">{status || "Passez à l'illimité pour 4,99€"}</p>
          <a href="https://buy.stripe.com/9B614g1Ri9sweUY9pWbfO04" target="_blank" className="block text-center bg-blue-600 text-white p-2 rounded mb-4">Acheter mon code</a>
          <input type="text" placeholder="Entrez votre code" value={licenseCode} onChange={(e) => setLicenseCode(e.target.value)} className="w-full border p-2 mb-2 text-black" />
          <button onClick={handleActivate} className="w-full bg-gray-800 text-white p-2 rounded">Activer l'illimité</button>
        </div>
      )}
    </div>
  );
}
