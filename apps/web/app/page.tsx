"use client";

import Link from "next/link";
import {
  Bot,
  CalendarDays,
  Flame,
  MapPin,
  Phone,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";

const menuSections = [
  {
    title: "Hamburguesas",
    items: [
      ["Clásica", "$80"],
      ["Pizza Burger", "$90"],
      ["Hawaiana", "$100"],
      ["Tocino", "$100"],
      ["Salchiburger", "$100"],
      ["Chicken pizza", "$100"],
      ["Chicken burger", "$100"],
      ["Doble", "$120"],
      ["Monster Burger", "$150"],
      ["Super Combo", "$170"]
    ]
  },
  {
    title: "Papas",
    items: [
      ["Sencillas", "$50"],
      ["Con queso", "$65"],
      ["Carne y queso", "$100"],
      ["Chicken papas", "$100"],
      ["Salchipapas", "$70"]
    ]
  },
  {
    title: "Tacos",
    items: [
      ["Pirata", "$75"],
      ["Bistek", "$90"],
      ["Piratitas", "$100"],
      ["Caprichos", "$120"]
    ]
  },
  {
    title: "Tortas",
    items: [
      ["Pierna", "$100"],
      ["Bistek", "$120"],
      ["Milanesa de Res", "$140"]
    ]
  },
  {
    title: "Hotdogs",
    items: [
      ["Sencillo", "$40"],
      ["Grande", "$50"],
      ["Combo Dogo", "$160"]
    ]
  },
  {
    title: "Complementos",
    items: [
      ["Dedos de queso", "$50"],
      ["Que Papas", "$45"],
      ["Jalapeños Poppers", "$20"],
      ["Frijoles charros", "$50"],
      ["Frijoles charros queso y carne", "$65"]
    ]
  },
  {
    title: "Antojitos MX",
    items: [
      ["Enchiladas", "$100"],
      ["Tostada Especial", "$85"],
      ["Flautas de res", "$120"],
      ["Taco Especial", "$55"]
    ]
  },
  {
    title: "Bebidas",
    items: [
      ["Aguas naturales 1 Litro", "$40"],
      ["Aguas naturales 500 ml", "$30"],
      ["Refrescos 355 ml", "$20"],
      ["Refrescos 500 ml", "$25"],
      ["Refrescos 600 ml", "$30"],
      ["Limón", ""],
      ["Horchata", ""],
      ["Mango", ""],
      ["Jamaica", ""],
      ["Pepino-Limón", ""],
      ["Tamarindo", ""]
    ]
  },
  {
    title: "Postres",
    items: [
      ["Cheese-cake", "$60"],
      ["3 leches", ""],
      ["Fresa", ""],
      ["Tortuga", ""],
      ["Carlos V", ""],
      ["Nap", ""]
    ]
  }
];

const features = [
  { icon: Phone, label: "81-2863-2862", detail: "Contacto directo" },
  { icon: CalendarDays, label: "Jueves a Martes", detail: "1:00pm a 11:30pm" },
  { icon: Flame, label: "Miércoles cerrado", detail: "Horario especial" },
  { icon: MapPin, label: "Av. Nogales 655", detail: "Bosques de los Nogales" }
];

const seleniumSteps = [
  "Abre una URL real del menú o catálogo.",
  "Detecta tarjetas, imágenes y fondos del DOM.",
  "Descarga una imagen por producto en carpeta local.",
  "Sigue aunque algún platillo no tenga imagen."
];

export default function RootPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,74,74,0.14),_transparent_24%),radial-gradient(circle_at_82%_14%,_rgba(255,255,255,0.08),_transparent_20%),linear-gradient(180deg,#050505_0%,#101010_100%)] text-[#f5f2ef]">
      <section className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-10">
        <div className="overflow-hidden rounded-[34px] border border-red-500/35 bg-[#0c0c0c]/96 shadow-[0_28px_80px_rgba(0,0,0,.5)]">
          <div className="grid gap-8 px-5 py-8 lg:grid-cols-[1.08fr_.92fr] lg:px-10 lg:py-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-red-200">
                <Sparkles className="h-4 w-4" />
                Burger's Racing
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-[-0.07em] text-white md:text-6xl">
                Menú listo para pedidos
                <span className="block text-red-400">hamburguesas, tacos, papas y más</span>
              </h1>

              <p className="mt-5 max-w-2xl text-lg text-white/72 md:text-xl">
                Portada pensada para este negocio, con el menú de la imagen, los horarios y la ubicación visibles, más la
                utilidad de descarga de imágenes por Selenium conectada a una fuente real.
              </p>

              <div className="mt-8 grid gap-3 text-sm text-white/82 sm:grid-cols-2">
                {features.map(({ icon: Icon, label, detail }) => (
                  <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <Icon className="h-4 w-4 text-red-400" />
                    <div>
                      <div className="font-semibold text-white">{label}</div>
                      <div className="text-xs text-white/55">{detail}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="#menu"
                  className="inline-flex items-center gap-2 rounded-full bg-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(239,68,68,.25)]"
                >
                  Ver menú
                  <UtensilsCrossed className="h-4 w-4" />
                </Link>
                <a
                  href="#automatizacion"
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-6 py-3 text-sm font-semibold text-white"
                >
                  <Bot className="h-4 w-4 text-red-300" />
                  Bot Selenium
                </a>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[#141414] p-5 shadow-[0_20px_60px_rgba(0,0,0,.35)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/45">Automatización</p>
                  <p className="mt-1 text-2xl font-black text-white">Descarga de imágenes</p>
                </div>
                <div className="rounded-full border border-red-500/25 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-200">
                  Menú real
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {seleniumSteps.map((step) => (
                  <div key={step} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
                    <Bot className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                    <p className="text-sm text-white/78">{step}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[24px] border border-white/8 bg-black/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/40">Variables clave</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/70">
                  {["MENU_SOURCE_URL", "DOWNLOAD_DIR", "CHROME_BINARY_PATH", "SELENIUM_TIMEOUT", "PAGE_LOAD_TIMEOUT"].map(
                    (name) => (
                      <span key={name} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        {name}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="menu" className="mx-auto max-w-[1500px] px-4 pb-8 md:px-8">
        <div className="grid gap-4 lg:grid-cols-4">
          {menuSections.map((section) => (
            <article
              key={section.title}
              className="rounded-[30px] border border-red-500/35 bg-[#0e0e0e] p-5 shadow-[0_20px_50px_rgba(0,0,0,.28)]"
            >
              <div className="mx-auto -mt-10 mb-5 w-fit rounded-full bg-red-500 px-5 py-2 text-sm font-black uppercase tracking-[0.2em] text-white">
                {section.title}
              </div>

              <div className="space-y-3">
                {section.items.map(([item, price]) => (
                  <div key={`${section.title}-${item}`} className="flex items-end justify-between gap-4 border-b border-white/6 pb-2">
                    <span className="text-sm font-semibold text-white/90">{item}</span>
                    <span className="text-sm font-black text-red-400">{price || " "}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="automatizacion" className="mx-auto max-w-[1500px] px-4 pb-16 md:px-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_.82fr]">
          <div className="rounded-[30px] border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-200">Pedido y trazabilidad</p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-white md:text-4xl">
              Enfocado para vender y registrar pedidos reales.
            </h2>
            <div className="mt-4 grid gap-3">
              {[
                "Cliente ve el menú.",
                "Elige hamburguesas, tacos, papas o complementos.",
                "Pide por WhatsApp.",
                "El sistema puede registrar clics y pedidos."
              ].map((step, index) => (
                <div key={step} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-black text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm text-white/78">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[#121212] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">Ejecución</p>
            <pre className="mt-4 overflow-auto rounded-[24px] border border-white/10 bg-black/35 p-4 text-xs leading-6 text-white/78">
{`export MENU_SOURCE_URL="https://tu-menu-real"
export DOWNLOAD_DIR="$PWD/menu_downloads"
export SELENIUM_HEADLESS=1
python3 scripts/download_menu_images_selenium.py`}
            </pre>
            <div className="mt-4 rounded-[24px] border border-red-500/15 bg-red-500/8 p-4 text-sm text-white/78">
              El negocio puede seguir usando WhatsApp como canal principal de venta.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
