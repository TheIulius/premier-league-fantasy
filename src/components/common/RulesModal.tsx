import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Shield, Award, Clock, AlertTriangle, Building, MapPin } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const [lang, setLang] = useState<'geo' | 'eng'>('geo');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl my-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white">
                  {lang === 'geo' ? 'ტურნირის წესები და ქულები' : 'Official Rules & Scoring'}
                </h2>
                <p className="text-[11px] text-slate-400">Komarovi Charity League Fantasy</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Switcher */}
              <div className="flex p-0.5 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-bold">
                <button
                  onClick={() => setLang('geo')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    lang === 'geo' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  GEO
                </button>
                <button
                  onClick={() => setLang('eng')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    lang === 'eng' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ENG
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
            {/* 1. Squad Requirements */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>{lang === 'geo' ? '1. გუნდის შემადგენლობა' : '1. Squad Composition'}</span>
              </h3>
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <p className="font-semibold text-slate-200">
                  {lang === 'geo'
                    ? 'თითოეული მენეჯერის გუნდი შედგება ზუსტად 9 მოთამაშისგან:'
                    : 'Each fantasy squad must consist of exactly 9 players:'}
                </p>
                <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                  <li className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <span className="block font-black text-amber-400">1</span>
                    <span>{lang === 'geo' ? 'მეკარე (GK)' : 'Goalkeeper'}</span>
                  </li>
                  <li className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <span className="block font-black text-blue-400">3</span>
                    <span>{lang === 'geo' ? 'მცველი (DEF)' : 'Defenders'}</span>
                  </li>
                  <li className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <span className="block font-black text-emerald-400">3</span>
                    <span>{lang === 'geo' ? 'ნახევარმცველი (MID)' : 'Midfielders'}</span>
                  </li>
                  <li className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <span className="block font-black text-rose-400">2</span>
                    <span>{lang === 'geo' ? 'თავდამსხმელი (FWD)' : 'Forwards'}</span>
                  </li>
                </ul>
                <div className="pt-2 text-slate-400 text-[11px] space-y-1">
                  <p>
                    ⚠️ <strong className="text-slate-200">{lang === 'geo' ? 'კლასის ლიმიტი:' : 'Class Limit:'}</strong>{' '}
                    {lang === 'geo'
                      ? 'ერთი და იგივე კლასიდან (მაგ. 11/5, 9/2) ნებადართულია მაქსიმუმ 2 მოთამაშე.'
                      : 'Maximum 2 players from the same class (e.g. 11/5, 9/2).'}
                  </p>
                  <p>
                    👥 <strong className="text-slate-200">{lang === 'geo' ? 'ძირითადი & სკამი:' : 'Lineup:'}</strong>{' '}
                    {lang === 'geo'
                      ? '6 ძირითადი მოთამაშე + 3 სათადარიგო. ძირითადში აუცილებელია: 1 მეკარე, 1-3 მცველი, 1-3 ნახევარმცველი, 1-2 თავდამსხმელი.'
                      : '6 starters + 3 bench. Formation must have 1 GK, 1-3 DEF, 1-3 MID, 1-2 FWD.'}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Scoring System Table: Delisi vs One Price */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                <span>{lang === 'geo' ? '2. ქულების სისტემა სტადიონების მიხედვით' : '2. Stadium Points Comparison'}</span>
              </h3>

              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-2.5 sm:p-3">{lang === 'geo' ? 'მოქმედება' : 'Action'}</th>
                      <th className="p-2.5 sm:p-3 text-center bg-slate-900/40">
                        <span className="flex items-center justify-center gap-1 text-slate-200">
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          <span>{lang === 'geo' ? 'სტანდარტული (Delisi)' : 'Standard (Delisi)'}</span>
                        </span>
                      </th>
                      <th className="p-2.5 sm:p-3 text-center bg-amber-500/10 text-amber-300">
                        <span className="flex items-center justify-center gap-1">
                          <Building className="w-3 h-3 text-amber-400" />
                          <span>One Price Stadium</span>
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 font-sans font-medium text-slate-200">
                        {lang === 'geo' ? 'მეკარის გოლი' : 'Goalkeeper Goal'}
                      </td>
                      <td className="p-2.5 text-center font-bold text-emerald-400">+7</td>
                      <td className="p-2.5 text-center font-bold text-amber-300 bg-amber-500/5">+6</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 font-sans font-medium text-slate-200">
                        {lang === 'geo' ? 'მცველის გოლი' : 'Defender Goal'}
                      </td>
                      <td className="p-2.5 text-center font-bold text-emerald-400">+6</td>
                      <td className="p-2.5 text-center font-bold text-amber-300 bg-amber-500/5">+5</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 font-sans font-medium text-slate-200">
                        {lang === 'geo' ? 'ნახევარმცველის გოლი' : 'Midfielder Goal'}
                      </td>
                      <td className="p-2.5 text-center font-bold text-emerald-400">+5</td>
                      <td className="p-2.5 text-center font-bold text-amber-300 bg-amber-500/5">+4</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 font-sans font-medium text-slate-200">
                        {lang === 'geo' ? 'თავდამსხმელის გოლი' : 'Forward Goal'}
                      </td>
                      <td className="p-2.5 text-center font-bold text-emerald-400">+4</td>
                      <td className="p-2.5 text-center font-bold text-amber-300 bg-amber-500/5">+3</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 font-sans font-medium text-slate-200">
                        {lang === 'geo' ? 'საგოლე გადაცემა (ასისტი)' : 'Assist'}
                      </td>
                      <td className="p-2.5 text-center font-bold text-sky-400">+3</td>
                      <td className="p-2.5 text-center font-bold text-amber-300 bg-amber-500/5">+2</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 font-sans font-medium text-slate-200">
                        {lang === 'geo' ? 'MVP (მატჩის საუკეთესო)' : 'Match MVP'}
                      </td>
                      <td className="p-2.5 text-center font-bold text-amber-400">+3</td>
                      <td className="p-2.5 text-center font-bold text-amber-300 bg-amber-500/5">+2</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Additional Points & Penalties */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{lang === 'geo' ? '3. დამატებითი ქულები და ჯარიმები' : '3. Additional Scoring & Penalties'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                {/* Conceded goals */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-rose-500/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-bold text-rose-300">
                      {lang === 'geo' ? 'გაშვებული გოლები (DEF/GK)' : 'Goals Conceded (DEF/GK)'}
                    </span>
                    <span className="font-black text-rose-400">-1 ქულა / 2 გოლზე</span>
                  </div>
                  <p className="font-sans text-[10px] text-slate-400">
                    {lang === 'geo'
                      ? 'მეკარეებსა და მცველებს ყოველ 2 გაშვებულ გოლზე აკლდებათ -1 ქულა.'
                      : '-1 point for every 2 goals conceded by the team.'}
                  </p>
                </div>

                {/* Own Goal */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-rose-500/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-bold text-rose-300">
                      {lang === 'geo' ? 'ავტოგოლი (ყველა პოზიცია)' : 'Own Goal (All Positions)'}
                    </span>
                    <span className="font-black text-rose-400">-3 ქულა</span>
                  </div>
                  <p className="font-sans text-[10px] text-slate-400">
                    {lang === 'geo' ? 'საკუთარ კარში გატანილ გოლზე -3 ქულა.' : '-3 points for scoring an own goal.'}
                  </p>
                </div>

                {/* Missed Penalty */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-amber-500/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-bold text-amber-300">
                      {lang === 'geo' ? 'გაფუჭებული პენალტი' : 'Missed Penalty'}
                    </span>
                    <span className="font-black text-rose-400">-2 ქულა</span>
                  </div>
                  <p className="font-sans text-[10px] text-slate-400">
                    {lang === 'geo' ? 'პენალტის აცილებაზე ან გაფუჭებაზე -2 ქულა.' : '-2 points for missing a penalty.'}
                  </p>
                </div>

                {/* Saved Penalty */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-emerald-500/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-bold text-emerald-300">
                      {lang === 'geo' ? 'მოგერიებული პენალტი (GK)' : 'Saved Penalty (GK only)'}
                    </span>
                    <span className="font-black text-emerald-400">+3 ქულა</span>
                  </div>
                  <p className="font-sans text-[10px] text-slate-400">
                    {lang === 'geo' ? 'მეკარის მიერ პენალტის აღებაზე +3 ქულა.' : '+3 points for goalkeeper saving penalty.'}
                  </p>
                </div>

                {/* Clean Sheet */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-bold text-emerald-300">
                      {lang === 'geo' ? 'მშრალი მატჩი (Clean Sheet)' : 'Clean Sheet'}
                    </span>
                    <span className="font-black text-emerald-400">+4 GK/DEF, +1 MID</span>
                  </div>
                  <p className="font-sans text-[10px] text-slate-400">
                    {lang === 'geo'
                      ? 'მოითხოვს მოედანზე მინიმუმ 20 წუთის გატარებას.'
                      : 'Player must play 20+ minutes with 0 goals conceded.'}
                  </p>
                </div>

                {/* Minutes Played */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-bold text-slate-200">
                      {lang === 'geo' ? 'ნათამაშები წუთები' : 'Minutes Played'}
                    </span>
                    <span className="font-black text-emerald-400">+1 (1-19&apos;), +2 (20+&apos;)</span>
                  </div>
                  <p className="font-sans text-[10px] text-slate-400">
                    {lang === 'geo'
                      ? '1+ წუთი მოედანზე: +1 ქულა; 20+ წუთი მოედანზე: +2 ქულა.'
                      : '+1 pt for 1-19 minutes; +2 pts for 20+ minutes.'}
                  </p>
                </div>

                {/* Yellow & Red Cards */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-bold text-slate-200">
                      {lang === 'geo' ? 'დისციპლინა (ბარათები)' : 'Cards & Discipline'}
                    </span>
                    <span className="font-black text-rose-400">🟨 -1, 🟥 -3</span>
                  </div>
                  <p className="font-sans text-[10px] text-slate-400">
                    {lang === 'geo'
                      ? 'ყვითელი ბარათი: -1 ქულა; წითელი ბარათი: -3 ქულა.'
                      : 'Yellow card: -1 point; Red card: -3 points.'}
                  </p>
                </div>
              </div>
            </div>

            {/* 4. One Price Stadium Official Note */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <h4 className="font-black text-xs uppercase tracking-wider text-amber-300">
                  {lang === 'geo' ? '4. One Price Stadium-ის გამონაკლისი' : '4. One Price Stadium Exception'}
                </h4>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-100/90">
                {lang === 'geo' ? (
                  <>
                    One Price Stadium-ზე ჩატარებულ მატჩებში გოლების, საგოლე გადაცემებისა და MVP-ის სტანდარტული ქულების
                    რაოდენობა <strong>1 ქულით მცირდება</strong>. ეს ცვლილება მოქმედებს იმის გამო, რომ One Price
                    Stadium-ზე გატანილი გოლების საშუალო რაოდენობა მნიშვნელოვნად აღემატება Delisi (Parki) Stadium-ის
                    მაჩვენებელს. <em>ყველა სხვა ქულების წესი უცვლელი რჩება.</em>
                  </>
                ) : (
                  <>
                    In matches played at <strong>One Price Stadium</strong>, standard points awarded for Goals, Assists,
                    and MVP are each <strong>reduced by 1 point</strong>. This adjustment accounts for the significantly
                    higher average goal-scoring rate compared to Delisi (Parki) Stadium. All other rules remain
                    unmodified.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors shadow-sm"
            >
              {lang === 'geo' ? 'გასაგებია' : 'Got It'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
