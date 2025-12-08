import React from 'react';
import { Sparkles, Mic, Brain, Zap, ArrowRight, Github, Twitter, Linkedin } from 'lucide-react';

interface LandingPageProps {
    onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Hero Section */}
            <section className="flex-1 flex items-center justify-center px-4 py-20 relative overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse-slow"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>

                    {/* Floating Geometric Shapes */}
                    <div className="absolute top-20 right-20 w-12 h-12 border-2 border-primary/30 rounded-lg rotate-45 animate-pulse"></div>
                    <div className="absolute bottom-40 left-20 w-16 h-16 border-2 border-secondary/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                    <div className="absolute top-1/2 right-1/3 w-8 h-8 bg-gradient-to-br from-primary/20 to-secondary/20 rounded animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                </div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/50 backdrop-blur-sm border border-primary/20 mb-8 animate-pulse">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm text-slate-300">AI-Powered Interview Practice</span>
                    </div>

                    {/* Main Heading */}
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                        <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-pulse-slow">
                            Master Your Next
                        </span>
                        <br />
                        <span className="text-white">Interview with AI</span>
                    </h1>

                    {/* Subheading */}
                    <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Practice realistic interviews powered by Gemini Live.
                        Get instant feedback, improve your skills, and land your dream job or scholarship.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                        <button
                            onClick={onGetStarted}
                            className="group px-8 py-4 bg-gradient-to-r from-primary to-secondary rounded-xl text-white font-bold text-lg transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-primary/50 flex items-center gap-3"
                        >
                            Get Started
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <a
                            href="#features"
                            className="px-8 py-4 bg-surface/50 backdrop-blur-sm border border-slate-700 rounded-xl text-white font-semibold text-lg transition-all hover:border-primary/50 hover:bg-surface/80"
                        >
                            Learn More
                        </a>
                    </div>

                    {/* Feature Cards */}
                    <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
                        <FeatureCard
                            icon={<Mic className="w-8 h-8" />}
                            title="Voice Interaction"
                            description="Natural conversation with AI interviewer using advanced speech recognition"
                            gradient="from-primary/10 to-primary/5"
                        />
                        <FeatureCard
                            icon={<Brain className="w-8 h-8" />}
                            title="Smart Feedback"
                            description="Get intelligent insights and personalized tips to improve your answers"
                            gradient="from-secondary/10 to-secondary/5"
                        />
                        <FeatureCard
                            icon={<Zap className="w-8 h-8" />}
                            title="Instant Practice"
                            description="Start practicing immediately for job interviews or scholarships"
                            gradient="from-primary/10 to-secondary/5"
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-800 backdrop-blur-sm bg-surface/30 px-6 py-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        {/* Brand */}
                        <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-tr from-primary to-secondary p-2 rounded-lg">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold">Interviu</span>
                        </div>

                        {/* Links */}
                        <div className="flex gap-8 text-sm text-slate-400">
                            <a href="#" className="hover:text-primary transition-colors">About</a>
                            <a href="#" className="hover:text-primary transition-colors">Features</a>
                            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                            <a href="#" className="hover:text-primary transition-colors">Contact</a>
                        </div>

                        {/* Social Links */}
                        <div className="flex gap-4">
                            <SocialLink icon={<Github className="w-5 h-5" />} href="#" />
                            <SocialLink icon={<Twitter className="w-5 h-5" />} href="#" />
                            <SocialLink icon={<Linkedin className="w-5 h-5" />} href="#" />
                        </div>
                    </div>

                    {/* Copyright */}
                    <div className="mt-8 pt-6 border-t border-slate-800 text-center text-sm text-slate-500">
                        <p>© 2025 Interviu. Powered by <span className="text-primary">Gemini Live</span>. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

// Feature Card Component
interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    gradient: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, gradient }) => {
    return (
        <div className={`group p-6 rounded-2xl bg-gradient-to-br ${gradient} border border-slate-800/50 backdrop-blur-sm transition-all hover:border-primary/30 hover:scale-105 hover:shadow-xl hover:shadow-primary/10`}>
            <div className="text-primary mb-4 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
        </div>
    );
};

// Social Link Component
interface SocialLinkProps {
    icon: React.ReactNode;
    href: string;
}

const SocialLink: React.FC<SocialLinkProps> = ({ icon, href }) => {
    return (
        <a
            href={href}
            className="p-2 rounded-lg bg-surface/50 border border-slate-800 text-slate-400 hover:text-primary hover:border-primary/50 transition-all hover:scale-110"
        >
            {icon}
        </a>
    );
};

export default LandingPage;
