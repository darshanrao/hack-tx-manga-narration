'use client'

import { ArrowRight, Sparkles, Volume2, Zap } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a3e] to-[#2d1b4e] text-white overflow-hidden flex flex-col">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Scrollable content container */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600 hover:scrollbar-thumb-slate-500 scrollbar-thumb-rounded-full">
        {/* Navigation */}
        <nav className="relative z-10 container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xl">Sonokomi</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How it Works</a>
            <Link href="/">
              <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-2 rounded-full">
                Try Now
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 mb-8 backdrop-blur-sm">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">AI-Powered Audio Transcription</span>
          </div>

          {/* Main Heading */}
          <h1 className="mb-6 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent text-5xl md:text-6xl font-bold">
            Bring Your Manga to Life with AI Voice
          </h1>

          {/* Subheading */}
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Experience manga like never before. Our AI transcribes panels and transforms dialogue into immersive audio narration in seconds.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 mb-16">
            <Link href="/">
              <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-6 rounded-full shadow-lg shadow-purple-500/30 text-lg">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button variant="outline" className="border-gray-600 text-white hover:bg-white/5 px-8 py-6 rounded-full text-lg">
              Watch Demo
            </Button>
          </div>

        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="mb-4 text-4xl font-bold">Powerful Features</h2>
            <p className="text-gray-400 text-lg">Everything you need for an immersive manga reading experience</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 p-8 backdrop-blur-sm hover:border-purple-500/40 transition-all">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="mb-3 text-xl font-semibold">AI Text Extraction</h3>
              <p className="text-gray-400">Advanced AI accurately identifies and extracts text from manga panels with support for multiple languages.</p>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 p-8 backdrop-blur-sm hover:border-blue-500/40 transition-all">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-6">
                <Volume2 className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="mb-3 text-xl font-semibold">Natural Voice</h3>
              <p className="text-gray-400">Generate natural-sounding audio with distinct voices for different characters and emotional tones.</p>
            </Card>

            <Card className="bg-gradient-to-br from-pink-500/10 to-transparent border border-pink-500/20 p-8 backdrop-blur-sm hover:border-pink-500/40 transition-all">
              <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="mb-3 text-xl font-semibold">Lightning Fast</h3>
              <p className="text-gray-400">Process entire chapters in seconds with our optimized AI pipeline and cloud infrastructure.</p>
            </Card>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="mb-4 text-4xl font-bold">How It Works</h2>
            <p className="text-gray-400 text-lg">Simple steps to transform your manga experience</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="mb-3 text-xl font-semibold">Upload Your Manga</h3>
              <p className="text-gray-400">Upload PDF, CBZ, or image files of your favorite manga chapters.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-pink-500 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="mb-3 text-xl font-semibold">AI Processing</h3>
              <p className="text-gray-400">Our AI analyzes panels, extracts text, and prepares audio narration.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="mb-3 text-xl font-semibold">Enjoy Audio</h3>
              <p className="text-gray-400">Listen to natural voice narration while following along with the visuals.</p>
            </div>
          </div>
        </div>
      </div>

        {/* Footer */}
        <footer className="relative z-10 border-t border-gray-800 mt-20">
          <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-between text-gray-400 text-sm">
              <p>© 2025 Sonokomi. Built for hackathon.</p>
              <div className="flex items-center gap-6">
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-white transition-colors">Terms</a>
                <a href="#" className="hover:text-white transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
