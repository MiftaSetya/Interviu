import React from 'react';
import { Sparkles, Mic, Brain, Zap, ArrowRight } from 'lucide-react';

interface LandingPageProps {
    onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
    return (
        <div className="min-h-screen flex flex-col">
            <section className="flex-1 flex items-center justify-center px-4 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse-slow"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>

                    <div className="absolute top-20 right-20 w-12 h-12 border-2 border-primary/30 rounded-lg rotate-45 animate-pulse"></div>
                    <div className="absolute bottom-40 left-20 w-16 h-16 border-2 border-secondary/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                    <div className="absolute top-1/2 right-1/3 w-8 h-8 bg-gradient-to-br from-primary/20 to-secondary/20 rounded animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                </div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    {/* <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/50 backdrop-blur-sm border border-primary/20 mb-8 animate-pulse">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm text-slate-300">Latihan Wawancara Berbasis AI</span>
                    </div> */}

                    <h1 className="text-5xl md:text-7xl font-bold mb-6 mt-10">
                        <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-pulse-slow">
                            Siapkan Karirmu
                        </span>
                        <br />
                        <span className="text-white">Dengan Interviu</span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
                        Latihan wawancara realistis dengan teknologi AI berbahasa Indonesia.
                        Dapatkan feedback instan, tingkatkan kemampuan, dan raih pekerjaan atau beasiswa impianmu.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                        <button
                            onClick={onGetStarted}
                            className="group px-8 py-4 bg-gradient-to-r from-primary to-secondary rounded-xl text-white font-bold text-lg transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-primary/50 flex items-center gap-3"
                        >
                            Mulai Sekarang
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
                        <FeatureCard
                            icon={<Mic className="w-8 h-8" />}
                            title="Interaksi Suara"
                            description="Percakapan natural dengan AI interviewer menggunakan pengenalan suara canggih"
                            gradient="from-primary/10 to-primary/5"
                        />
                        <FeatureCard
                            icon={<Brain className="w-8 h-8" />}
                            title="Feedback Cerdas"
                            description="Dapatkan wawasan pintar dan tips personal untuk meningkatkan jawaban Anda"
                            gradient="from-secondary/10 to-secondary/5"
                        />
                        <FeatureCard
                            icon={<Zap className="w-8 h-8" />}
                            title="Latihan Instan"
                            description="Mulai latihan segera untuk wawancara kerja atau beasiswa"
                            gradient="from-primary/10 to-secondary/5"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    gradient: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, gradient }) => {
    return (
        <div className={`group p-6 rounded-2xl bg-gradient-to-br ${gradient} border border-slate-800/50 backdrop-blur-sm transition-all hover:border-primary/30 hover:scale-105 hover:shadow-xl hover:shadow-primary/10`}>
            <div className="flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
        </div>
    );
};

export default LandingPage;
