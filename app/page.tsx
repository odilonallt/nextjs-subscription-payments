// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function UltimateEstimator() {
  const supabase = createClient();
  
  const [category, setCategory] = useState('marketing');
  const [quantity, setQuantity] = useState(0);
  const [complexity, setComplexity] = useState(1);
  const [description, setDescription] = useState(''); // Variable pour stocker le texte
  
  const [result, setResult] = useState(null);
  const [user, setUser] = useState(null);
  const [licenseCode, setLicenseCode] = useState('');
  const [status, setStatus] = useState('');
  const [isCalculated, setIsCalculated] = useState(false);

  const projectTypes = {
    marketing: { label: "📈 Marketing & Pub", unit: "Nombre de campagnes / visuels", price: 250, icon: "🚀" },
    renovation: { label: "🏠 Rénovation & Immo", unit: "Surface totale en m²", price: 1400, icon: "🏗️" },
    tech: { label: "💻 Développement Web/IA", unit: "Nombre de fonctionnalités", price: 800, icon: "🤖" },
    design: { label: "🎨 Design & Branding", unit: "Nombre de déclinaisons", price: 350, icon: "💎" },
    event: { label: "🎉 Événementiel", unit: "Nombre d'invités", price: 75, icon: "🥂" },
    object: { label: "📦 Conception Produit", unit: "Complexité des prototypes", price: 1200, icon: "🛠️" }
  };

  useEffect(() => {
    const getData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
        setUser({ ...authUser, ...profile });
      }
    };
    getData();
  }, []);

  const handleEstimate = async () => {
    if (!user) return;
    if (!user.est_premium && user.compteur_essais >= 2) {
      setStatus("Limite gratuite atteinte.");
      return;
    }

    // Calcul de base
    const basePrice = projectTypes[category].price;
    const total = (quantity * basePrice) * complexity;
    
    // Note : Pour l'instant on affiche le calcul mathématique, 
    // mais la variable 'description' est maintenant prête à être envoyée à une IA.
    setResult(total);
    setIsCalculated(true);

    if (!user.est_premium) {
      const nextCount = (user.compteur_essais || 0) + 1;
      await supabase.from('profiles').update({ compteur_essais: nextCount }).eq('id', user.id);
      setUser({ ...user, compteur_essais: nextCount });
    }
  };

  const handleActivate = async () => {
    const { data: licence } = await supabase.from('licences').select('*').eq('code_secret', licenseCode).eq('est_utilise', false).single();
    if (licence) {
      await supabase.from('profiles').update({ est_premium: true }).eq('id', user.id);
      await supabase.from('licences').update({ est_utilise: true }).eq('code_secret', licenseCode);
      setUser({ ...user, est_premium: true });
      setStatus("✅ ACCÈS VIP ACTIVÉ !");
    } else {
      setStatus("❌ Code invalide ou déjà utilisé.");
    }
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 font-sans text-slate-500">
        Connexion en cours...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans text-slate-900">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <span className="inline-block rounded-full bg-indigo-100 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-600">IA de Devis</span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-6xl">Estimate <span className="text-indigo-600">Pro.</span></h1>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100 p-8 sm:p-12">
          <div className="grid gap-8">
            {/* ÉTAPE 1 : DOMAINE */}
            <div>
              <label className="text-sm font-bold text-slate-400 uppercase">1. Quel est le domaine ?</label>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Object.keys(projectTypes).map((key) => (
                  <button key={key} onClick={() => setCategory(key)} className={`flex flex-col items-center justify-center rounded-2xl border-2 py-4 transition-all ${category === key ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-indigo-200'}`}>
                    <span className="text-2xl">{projectTypes[key].icon}</span>
                    <span className="mt-2 text-xs font-bold">{projectTypes[key].label.split(' ')[1]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ÉTAPE 2 : QUANTITÉ ET COMPLEXITÉ */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-slate-400 uppercase">{projectTypes[category].unit}</label>
                <input type="number" onChange={(e) => setQuantity(Number(e.target.value))} className="mt-2 w-full rounded-2xl bg-slate-50 p-4 text-lg font-bold outline-none border-2 border-transparent focus:border-indigo-100 transition-all" placeholder="0" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-400 uppercase">Niveau d'exigence</label>
                <select onChange={(e) => setComplexity(Number(e.target.value))} className="mt-2 w-full rounded-2xl bg-slate-50 p-4 text-lg font-bold outline-none border-2 border-transparent focus:border-indigo-100 transition-all">
                  <option value="1">Standard</option>
                  <option value="1.6">Premium (+60%)</option>
                  <option value="2.5">Luxe / Expert (+150%)</option>
                </select>
              </div>
            </div>

            {/* ÉTAPE 3 : DESCRIPTION DÉTAILLÉE (AJOUTÉE ICI) */}
            <div>
              <label className="text-sm font-bold text-slate-400 uppercase">Description du projet</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez précisément votre besoin pour une estimation plus fine..."
                className="mt-2 w-full rounded-2xl bg-slate-50 p-4 text-sm outline-none border-2 border-transparent focus:border-indigo-100 transition-all min-h-[100px]"
              />
            </div>

            {/* BOUTON D'ACTION */}
            <button onClick={handleEstimate} className="flex items-center justify-center rounded-2xl bg-indigo-600 py-5 font-black text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
              GÉNÉRER L'EXPERTISE
            </button>
          </div>

          {/* RÉSULTAT */}
          {isCalculated && (
            <div className="mt-10 rounded-3xl bg-slate-900 p-8 text-center text-white shadow-2xl animate-in fade-in zoom-in duration-300">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-400">Budget Estimé Recommandé</p>
              <h2 className="mt-2 text-5xl font-black">{result?.toLocaleString('fr-FR')} €</h2>
            </div>
          )}
        </div>

        {/* SECTION VIP (STRIPE / CODES) */}
        {user.compteur_essais >= 2 && !user.est_premium && (
          <div className="mt-8 rounded-3xl border-2 border-indigo-600 bg-white p-8 text-center shadow-xl">
            <h3 className="text-2xl font-black">Accès VIP Requis 🔒</h3>
            <div className="mt-6 flex flex-col items-center gap-4">
              <a href="https://buy.stripe.com/9B614g1Ri9sweUY9pWbfO04" target="_blank" className="w-full max-w-xs rounded-2xl bg-indigo-600 py-4 font-black text-white shadow-lg hover:scale-105 transition-transform">OBTENIR MON CODE VIP</a>
              <div className="flex w-full max-w-md items-center gap-2">
                <input type="text" placeholder="CODE VIP" value={licenseCode} onChange={(e) => setLicenseCode(e.target.value)} className="flex-1 rounded-xl border p-4 uppercase outline-none focus:border-indigo-600" />
                <button onClick={handleActivate} className="rounded-xl bg-slate-900 px-6 py-4 font-bold text-white hover:bg-black transition-colors">ACTIVER</button>
              </div>
              {status && <p className="text-sm font-bold text-indigo-600">{status}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
