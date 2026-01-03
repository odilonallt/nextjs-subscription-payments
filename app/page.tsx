// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function UltimateEstimator() {
  const supabase = createClient();
  
  // États de l'application
  const [category, setCategory] = useState('marketing');
  const [quantity, setQuantity] = useState(0);
  const [complexity, setComplexity] = useState(1);
  const [description, setDescription] = useState('');
  
  const [result, setResult] = useState(null);
  const [user, setUser] = useState(null);
  const [licenseCode, setLicenseCode] = useState('');
  const [status, setStatus] = useState('');
  const [isCalculated, setIsCalculated] = useState(false);

  // Configuration des domaines d'activité
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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setUser({ ...user, ...profile });
      }
    };
    getData();
  }, []);

  const handleEstimate = async () => {
    if (!user.est_premium && user.compteur_essais >= 2) {
      setStatus("Limite gratuite atteinte.");
      return;
    }

    // Algorithme de calcul
    const basePrice = projectTypes[category].price;
    const total = (quantity * basePrice) * complexity;
    setResult(total);
    setIsCalculated(true);

    if (!user.est_premium) {
      const nextCount = (user.compteur_essais || 0) + 1;
      await supabase.from('profiles').update({ compteur_essais: nextCount }).eq('id', user.id);
      setUser({ ...user, compteur_essais: nextCount });
    }
  };

  const handleActivate = async () => {
    const { data: licence } = await supabase.from('licences')
      .select('*').eq('code_secret', licenseCode).eq('est_utilise', false).single();

    if (licence) {
      await supabase.from('profiles').update({ est_premium: true }).eq('id', user.id);
      await supabase.from('licences').update({ est_utilise: true }).eq('code_secret', licenseCode);
      setUser({ ...user, est_premium: true });
      setStatus("✅ ACCÈS VIP ACTIVÉ !");
    } else {
      setStatus("❌ Code invalide ou déjà utilisé.");
    }
  };

  if (!user) return <div className="flex h-screen items-center justify-center bg-slate-50 font-sans text-slate-500">Initialisation du terminal...</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans text-slate-900">
      <div className="mx-auto max-w-3xl">
        
        {/* HEADER */}
        <div className="mb-10 text-center">
          <span className="inline-block rounded-full bg-indigo-100 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-600">
            Intelligence Artificielle de Devis
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-6xl">
            Estimate <span className="text-indigo-600">Pro.</span>
          </h1>
          <p className="mt-4 text-lg text-slate-600">Générez des estimations précises pour n'importe quel secteur industriel.</p>
        </div>

        {/* MAIN CARD */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-indigo-100 border border-slate-100">
          <div className="p-8 sm:p-12">
            
            <div className="grid gap-8">
              {/* SÉLECTION CATÉGORIE */}
              <div>
                <label className="text-sm font-bold text-slate-400 uppercase">1. Quel est le domaine ?</label>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {Object.keys(projectTypes).map((key) => (
                    <button
                      key={key}
                      onClick={() => setCategory(key)}
                      className={`flex flex-col items-center justify-center rounded-2xl border-2 py-4 transition-all ${category === key ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-indigo-200'}`}
                    >
                      <span className="text-2xl">{projectTypes[key].icon}</span>
                      <span className="mt-2 text-xs font-bold">{projectTypes[key].label.split(' ')[1]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* INPUTS DYNAMIQUES */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-slate-400 uppercase">{projectTypes[category].unit}</label>
                  <input
                    type="number"
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="mt-2 w-full rounded-2xl bg-slate-50 p-4 text-lg font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-400 uppercase">Niveau d'exigence</label>
                  <select
                    onChange={(e) => setComplexity(Number(e.target.value))}
                    className="mt-2 w-full rounded-2xl bg-slate-50 p-4 text-lg font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="1">Standard</option>
                    <option value="1.6">Premium (+60%)</option>
                    <option value="2.5">Luxe / Expert (+150%)</option>
                  </select>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="text-sm font-bold text-slate-400 uppercase">Notes particulières</label>
                <textarea
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Spécifiez vos contraintes ici..."
                  className="mt-2 h-28 w-full rounded-2xl bg-slate-50 p-4 outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <button
                onClick={handleEstimate}
                className="group relative flex items-center justify-center overflow-hidden rounded-2xl bg-indigo-600 py-5 font-black text-white transition-all hover:bg-indigo-700 active:scale-95"
              >
                <span className="relative z-10 uppercase tracking-widest">Générer l'expertise</span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full"></div>
              </button>
            </div>

            {/* RÉSULTAT */}
            {isCalculated && (
              <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="rounded-3xl bg-slate-900 p-8 text-center text-white shadow-2xl">
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-400">Budget Estimé Recommandé</p>
                  <h2 className="mt-2 text-6xl font-black tracking-tighter sm:text-7xl">
                    {result.toLocaleString('fr-FR')} <span className="text-2xl text-indigo-400">€</span>
                  </h2>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- ZONE VIP / PAIEMENT --- */}
        {user.compteur_essais >= 2 && !user.est_premium && (
          <div className="mt-8 overflow-hidden rounded-3xl border-2 border-indigo-600 bg-white p-8 text-center shadow-xl">
            <h3 className="text-2xl font-black text-slate-900
