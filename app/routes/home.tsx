import Navbar from "components/Navbar";
import type { Route } from "./+types/home";
import { ArrowRight, ArrowUpRight, Clock, Layers } from "lucide-react";
import Button from "components/ui/Button";
import Upload from "components/Upload";
import { useNavigate } from "react-router";
import { MAX_UPLOAD_FILE_SIZE_MB } from "lib/constants";
import { useEffect, useRef, useState } from "react";
import { createProject, getProjects } from "lib/puter.actions";

const HERO_FEATURES = ["3D massing", "AI material studies", "Share-ready renders"];

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Roomify - A Modern 3D Architecture Builder" },
    { name: "description", content: "This application is a modern 3D architecture builder" },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<DesignItem[]>([]);
  const isCreatingRef = useRef(false);

  const handleUploadComplete = async (base64Data: string) => {
    if (isCreatingRef.current) return false
    try {
      isCreatingRef.current = true;
      const newId = Date.now().toString();
      const name = `Residence ${newId}`;

      const newItem: DesignItem = {
        id: newId,
        name,
        sourceImage: base64Data,
        renderedImage: undefined,
        timestamp: Date.now(),
      };

      const saved = await createProject({ item: newItem, visibility: "private" });

      if (!saved) {
        console.error("Failed to create project");
        return false;
      }

      setProjects((prev) => [saved, ...prev]);
      navigate(`/visualizer/${newId}`, {
        state: {
          initialImage: base64Data,
          initialRender: saved.renderedImage || null,
          name,
        },
      });
      return true;
    } finally {
      isCreatingRef.current = false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchProjects = async () => {
      const items = await getProjects();
      if (isMounted) {
        setProjects(items);
      }
    };

    void fetchProjects();

    return () => {
      isMounted = false;
    };
  }, []);



  return (
    <>
      <div className="home">
        <Navbar />
        <section className="hero">
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <div className="announce">
                <div className="dot">
                  <div className="pulse"></div>
                </div>

                <p>Introducing Roomify Studio</p>
              </div>

              <h1 className="lg:mx-0">Shape architecture ideas faster with a brighter 3D workflow</h1>

              <p className="subtitle lg:mx-0">
                Upload a floor plan, explore fresh spatial concepts, and turn rough references into polished architectural visuals without leaving Roomify.
              </p>

              <div className="actions lg:justify-start">
                <a href="#upload" className="cta">Start Building <ArrowRight className="icon" /></a>

                <Button variant="outline" size="lg" className="demo">
                  Watch demo
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                {HERO_FEATURES.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full border border-slate-200/80 bg-white/70 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-600 shadow-[0_16px_36px_-28px_rgba(24,39,51,0.45)] backdrop-blur"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative w-full max-w-[35rem] justify-self-center lg:justify-self-end">
              <div className="absolute -inset-4 rounded-full bg-[radial-gradient(circle,_rgba(93,114,245,0.18)_0%,_rgba(31,138,112,0.14)_34%,_transparent_74%)] blur-3xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 p-4 shadow-[0_36px_90px_-48px_rgba(24,39,51,0.45)] backdrop-blur-xl">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.56),transparent_35%,rgba(93,114,245,0.12))]" />

                <div className="absolute left-4 top-4 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-[0_20px_44px_-34px_rgba(24,39,51,0.45)] backdrop-blur">
                  <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">Live Scene</p>
                  <p className="mt-1 font-serif text-lg text-slate-900">3D Blockout</p>
                </div>

                <div className="absolute bottom-4 right-4 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-right shadow-[0_20px_44px_-34px_rgba(24,39,51,0.45)] backdrop-blur">
                  <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">Blueprint Layer</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">Site + Massing</p>
                </div>

                <svg
                  viewBox="0 0 520 420"
                  className="relative z-10 h-auto w-full"
                  role="img"
                  aria-label="Decorative 3D architectural scene with buildings placed on a stylized site map"
                >
                  <defs>
                    <linearGradient id="siteBase" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="55%" stopColor="#edf4f1" />
                      <stop offset="100%" stopColor="#dce7e2" />
                    </linearGradient>
                    <linearGradient id="siteShadow" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d7e2de" />
                      <stop offset="100%" stopColor="#c1d2cb" />
                    </linearGradient>
                    <linearGradient id="buildingFront" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#eef8f5" />
                      <stop offset="100%" stopColor="#cdded8" />
                    </linearGradient>
                    <linearGradient id="buildingSide" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#bfd1cb" />
                      <stop offset="100%" stopColor="#abc2ba" />
                    </linearGradient>
                    <linearGradient id="roofGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#f2f8f5" />
                    </linearGradient>
                    <filter id="sceneShadow" x="-30%" y="-30%" width="160%" height="180%">
                      <feDropShadow dx="0" dy="20" stdDeviation="18" floodColor="#182533" floodOpacity="0.18" />
                    </filter>
                  </defs>

                  <circle cx="140" cy="84" r="46" fill="#5d72f5" fillOpacity="0.08" />
                  <circle cx="404" cy="118" r="60" fill="#1f8a70" fillOpacity="0.08" />

                  <g filter="url(#sceneShadow)">
                    <polygon points="76 266 260 152 444 266 260 380" fill="#d6e0dc" fillOpacity="0.8" />
                    <polygon points="98 248 260 148 422 248 260 348" fill="url(#siteBase)" />
                    <polygon points="98 248 98 282 260 382 260 348" fill="url(#siteShadow)" fillOpacity="0.94" />
                    <polygon points="422 248 422 282 260 382 260 348" fill="#ccd9d4" />

                    <polyline points="132 248 260 170 388 248" fill="none" stroke="#bfd2cb" strokeWidth="6" strokeLinecap="round" />
                    <polyline points="165 288 260 228 355 288" fill="none" stroke="#d2ded8" strokeWidth="12" strokeLinecap="round" />
                    <polyline points="145 228 241 286" fill="none" stroke="#d3ddd9" strokeWidth="10" strokeLinecap="round" />
                    <polyline points="276 286 372 228" fill="none" stroke="#d3ddd9" strokeWidth="10" strokeLinecap="round" />

                    <polyline points="171 231 171 301" fill="none" stroke="#c7d6d0" strokeWidth="4" />
                    <polyline points="211 208 211 325" fill="none" stroke="#c7d6d0" strokeWidth="4" />
                    <polyline points="308 208 308 325" fill="none" stroke="#c7d6d0" strokeWidth="4" />
                    <polyline points="348 231 348 301" fill="none" stroke="#c7d6d0" strokeWidth="4" />

                    <polygon points="242 178 286 152 330 178 286 204" fill="url(#roofGlow)" />
                    <polygon points="242 178 242 258 286 284 286 204" fill="url(#buildingFront)" />
                    <polygon points="286 204 330 178 330 258 286 284" fill="url(#buildingSide)" />
                    <rect x="257" y="196" width="14" height="48" rx="7" fill="#1f8a70" fillOpacity="0.28" />
                    <rect x="292" y="198" width="14" height="44" rx="7" fill="#5d72f5" fillOpacity="0.18" />

                    <polygon points="168 236 208 212 246 234 206 258" fill="url(#roofGlow)" />
                    <polygon points="168 236 168 296 206 318 206 258" fill="url(#buildingFront)" />
                    <polygon points="206 258 246 234 246 294 206 318" fill="url(#buildingSide)" />
                    <rect x="183" y="246" width="12" height="32" rx="6" fill="#d67a5c" fillOpacity="0.26" />

                    <polygon points="325 229 367 205 405 228 363 252" fill="url(#roofGlow)" />
                    <polygon points="325 229 325 311 363 334 363 252" fill="url(#buildingFront)" />
                    <polygon points="363 252 405 228 405 309 363 334" fill="url(#buildingSide)" />
                    <rect x="342" y="244" width="12" height="52" rx="6" fill="#1f8a70" fillOpacity="0.26" />
                    <rect x="374" y="246" width="11" height="48" rx="5.5" fill="#5d72f5" fillOpacity="0.18" />

                    <polygon points="181 188 217 167 249 186 213 207" fill="url(#roofGlow)" />
                    <polygon points="181 188 181 238 213 257 213 207" fill="url(#buildingFront)" />
                    <polygon points="213 207 249 186 249 236 213 257" fill="url(#buildingSide)" />

                    <polygon points="280 255 316 234 350 255 314 276" fill="#edf5f1" />
                    <polygon points="280 255 280 285 314 306 314 276" fill="#d8e4de" />
                    <polygon points="314 276 350 255 350 285 314 306" fill="#c8d9d2" />

                    <circle cx="142" cy="288" r="10" fill="#1f8a70" fillOpacity="0.16" />
                    <circle cx="379" cy="317" r="10" fill="#d67a5c" fillOpacity="0.18" />
                    <circle cx="232" cy="330" r="9" fill="#5d72f5" fillOpacity="0.16" />
                    <circle cx="284" cy="324" r="9" fill="#1f8a70" fillOpacity="0.16" />
                  </g>
                </svg>
              </div>
            </div>
          </div>

          <div id="upload" className="upload-shell">
            <div className="grid-overlay" />

            <div className="upload-card">
              <div className="upload-head">
                <div className="upload-icon">
                  <Layers className="icon" />
                </div>
                <h3>Upload your floor plan</h3>
                <p>Supports JPG, PNG formats up to {MAX_UPLOAD_FILE_SIZE_MB}MB</p>
              </div>
              <Upload onComplete={handleUploadComplete} />
            </div>
          </div>
        </section>

        <section className="projects">
          <div className="section-inner">
            <div className="section-head">
              <div className="copy">
                <h2>Projects</h2>
                <p>Your latest work and shared community projects, all in one place</p>
              </div>
            </div>

            <div className="projects-grid">
              {projects.map(({ id, name, renderedImage, sourceImage, timestamp }) => (
                <div
                  key={id}
                  className="project-card group"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/visualizer/${id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/visualizer/${id}`);
                    }
                  }}
                >
                  <div className="preview">
                    <img src={renderedImage || sourceImage} alt={name || "Project preview"} />

                    <div className="badge">
                      <span>{renderedImage ? "Rendered" : "Source"}</span>
                    </div>
                  </div>

                  <div className="card-body">
                    <div>
                      <h3>{name || "Untitled Project"}</h3>

                      <div className="meta">
                        <Clock size={12} />
                        <span>{new Date(timestamp).toLocaleDateString()}</span>
                        <span>By You</span>
                      </div>
                    </div>

                    <div className="arrow">
                      <ArrowUpRight size={18} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
