"use client";

import { useTransition, useState } from "react";
import { createTask, createTaskFromLibrary } from "./actions";
import { Plus, X, BookOpen, PenSquare, ShieldAlert, Target } from "lucide-react";
import type { TaskLibrary } from "@woilaa/db-bitmove";

type Props = {
  library: TaskLibrary[];
};

export function CreateQuestForm({ library }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<"library" | "custom">("library");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [polarity, setPolarity] = useState<"POSITIVE" | "NEGATIVE">("POSITIVE");

  const handleAddFromLibrary = (libraryId: string) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await createTaskFromLibrary(libraryId);
      if (result?.error) {
        setFeedback(result.error);
      } else {
        setFeedback("✅ Directive berhasil ditambahkan!");
      }
    });
  };

  const handleCustomSubmit = async (formData: FormData) => {
    formData.set("polarity", polarity);
    await createTask(formData);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 md:bottom-12 md:right-12 bg-primary text-black flex items-center gap-3 px-6 py-4 border-l-4 border-secondary shadow-[0_0_20px_rgba(142,255,113,0.3)] hover:shadow-[0_0_30px_rgba(142,255,113,0.6)] hover:-translate-y-1 transition-all z-40 group"
      >
        <Plus className="w-5 h-5 font-black group-hover:rotate-90 transition-transform duration-300" />
        <span className="font-headline font-black uppercase tracking-widest text-sm pt-0.5">NEW DIRECTIVE</span>
      </button>
    );
  }

  // Group library by polarity then category
  const positiveItems = library.filter(i => (i.polarity ?? "POSITIVE") === "POSITIVE");
  const negativeItems = library.filter(i => i.polarity === "NEGATIVE");

  const groupByCategory = (items: TaskLibrary[]) =>
    items.reduce<Record<string, TaskLibrary[]>>((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

  const positiveGrouped = groupByCategory(positiveItems);
  const negativeGrouped = groupByCategory(negativeItems);
  const allGrouped      = groupByCategory(library);

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-surface-container border-l-4 border-primary w-full max-w-lg animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-outline-variant/30 shrink-0">
            <h3 className="font-headline font-black uppercase text-xl text-primary tracking-widest">
              ASSIGN NEW DIRECTIVE
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-on-surface-variant hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex shrink-0 border-b border-outline-variant/30">
            <button
              onClick={() => setTab("library")}
              className={`flex-1 py-3 font-headline font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${
                tab === "library"
                  ? "text-primary border-b-2 border-primary"
                  : "text-on-surface-variant hover:text-white"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              DATABASE
            </button>
            <button
              onClick={() => setTab("custom")}
              className={`flex-1 py-3 font-headline font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${
                tab === "custom"
                  ? "text-primary border-b-2 border-primary"
                  : "text-on-surface-variant hover:text-white"
              }`}
            >
              <PenSquare className="w-4 h-4" />
              CUSTOM
            </button>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`px-6 pt-4 font-headline font-bold text-xs uppercase tracking-widest ${feedback.startsWith("✅") ? "text-primary" : "text-error"}`}>
              {feedback}
            </div>
          )}

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-6">
            {tab === "library" ? (
              <div className="space-y-8">
                {library.length === 0 ? (
                  <p className="text-center text-on-surface-variant font-headline uppercase tracking-widest text-xs py-8">
                    Task Library masih kosong. Isi dulu dari Master Data!
                  </p>
                ) : (
                  <>
                    {/* Positive tasks */}
                    {Object.entries(positiveGrouped).map(([category, items]) => (
                      <div key={`pos-${category}`}>
                        <div className="font-headline font-bold text-[10px] uppercase tracking-widest text-on-surface-variant mb-3 border-b border-outline-variant/30 pb-1">
                          🎯 {category}
                        </div>
                        <div className="space-y-2">
                          {items.map((item) => (
                            <button
                              key={item.id}
                              disabled={isPending}
                              onClick={() => handleAddFromLibrary(item.id)}
                              className="w-full flex items-center justify-between p-4 bg-surface-container-high border border-outline-variant/30 hover:border-primary hover:bg-surface-bright transition-all group text-left"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{item.iconEmoji || "📋"}</span>
                                <div>
                                  <div className="font-headline font-black text-sm uppercase text-white">
                                    {item.title}
                                  </div>
                                  <div className="font-headline font-bold text-[10px] uppercase tracking-widest text-on-surface-variant mt-0.5">
                                    {item.defaultFrequency} • {item.defaultPriority} Priority
                                  </div>
                                </div>
                              </div>
                              <Plus className="w-4 h-4 text-on-surface-variant group-hover:text-primary shrink-0 transition-colors" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Negative / Forbidden tasks */}
                    {negativeItems.length > 0 && (
                      <div>
                        <div className="font-headline font-bold text-[10px] uppercase tracking-widest text-error mb-3 border-b border-error/30 pb-1 flex items-center gap-2">
                          <ShieldAlert className="w-3 h-3" /> FORBIDDEN PROTOCOLS
                        </div>
                        {Object.entries(negativeGrouped).map(([category, items]) => (
                          <div key={`neg-${category}`} className="mb-4">
                            <div className="font-headline font-bold text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
                              {category}
                            </div>
                            <div className="space-y-2">
                              {items.map((item) => (
                                <button
                                  key={item.id}
                                  disabled={isPending}
                                  onClick={() => handleAddFromLibrary(item.id)}
                                  className="w-full flex items-center justify-between p-4 bg-error/5 border border-error/20 hover:border-error/60 hover:bg-error/10 transition-all group text-left"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-xl">{item.iconEmoji || "🚫"}</span>
                                    <div>
                                      <div className="font-headline font-black text-sm uppercase text-error/90">
                                        {item.title}
                                      </div>
                                      <div className="font-headline font-bold text-[10px] uppercase tracking-widest text-error/50 mt-0.5">
                                        FORBIDDEN • {item.defaultPriority} Priority
                                      </div>
                                    </div>
                                  </div>
                                  <Plus className="w-4 h-4 text-error/40 group-hover:text-error shrink-0 transition-colors" />
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <form action={handleCustomSubmit} className="space-y-4">

                {/* Polarity Toggle */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-2">
                    Directive Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPolarity("POSITIVE")}
                      className={`flex items-center justify-center gap-2 py-3 border font-headline font-black text-xs uppercase tracking-widest transition-all ${
                        polarity === "POSITIVE"
                          ? "bg-primary/20 border-primary text-primary"
                          : "bg-surface-container-high border-outline-variant/50 text-on-surface-variant hover:text-white"
                      }`}
                    >
                      <Target className="w-4 h-4" />
                      🎯 Objective
                    </button>
                    <button
                      type="button"
                      onClick={() => setPolarity("NEGATIVE")}
                      className={`flex items-center justify-center gap-2 py-3 border font-headline font-black text-xs uppercase tracking-widest transition-all ${
                        polarity === "NEGATIVE"
                          ? "bg-error/20 border-error text-error"
                          : "bg-surface-container-high border-outline-variant/50 text-on-surface-variant hover:text-white"
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4" />
                      🚫 Forbidden
                    </button>
                  </div>
                  {polarity === "NEGATIVE" && (
                    <p className="mt-2 text-[10px] text-error/70 font-headline uppercase tracking-widest">
                      ⚠ Melanggar task ini akan dikenai PENALTI XP &amp; Points.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-1">
                    Directive Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full bg-surface-container-high border border-outline-variant/50 px-4 py-3 text-sm focus:border-primary focus:outline-none transition-colors"
                    placeholder={polarity === "NEGATIVE" ? "E.g. Makan Junkfood" : "E.g. Read 10 Pages"}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-1">
                      Category
                    </label>
                    <select name="category" className="w-full bg-surface-container-high border border-outline-variant/50 px-4 py-3 text-sm focus:border-primary focus:outline-none transition-colors appearance-none">
                      {Object.keys(allGrouped).length > 0 ? (
                        Object.keys(allGrouped).sort().map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))
                      ) : (
                        <>
                          <option value="Intellect">Intellect</option>
                          <option value="Vitality">Vitality</option>
                          <option value="Wealth">Wealth</option>
                          <option value="Charisma">Charisma</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-1">
                      Frequency
                    </label>
                    <select name="frequency" className="w-full bg-surface-container-high border border-outline-variant/50 px-4 py-3 text-sm focus:border-primary focus:outline-none transition-colors appearance-none">
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="OneTime">One-Time</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-1">
                    Priority Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Low", "Medium", "High"].map((p) => (
                      <label key={p} className="cursor-pointer">
                        <input type="radio" name="priority" value={p} className="peer sr-only" defaultChecked={p === "Medium"} />
                        <div className="text-center font-headline uppercase font-bold text-xs py-2 bg-surface-container-high border border-outline-variant/50 peer-checked:bg-primary/20 peer-checked:border-primary peer-checked:text-primary transition-colors">
                          {p}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full font-black uppercase tracking-widest py-4 mt-2 transition-all ${
                    polarity === "NEGATIVE"
                      ? "bg-error/20 text-error border border-error/50 hover:bg-error/30"
                      : "bg-primary text-black hover:shadow-[0_0_15px_#8eff71]"
                  }`}
                >
                  {polarity === "NEGATIVE" ? "⚠ ADD FORBIDDEN PROTOCOL" : "INITIALIZE DIRECTIVE"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
