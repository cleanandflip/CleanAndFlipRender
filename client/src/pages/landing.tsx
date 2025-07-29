import { Link } from "wouter";
import { Shield, Clock, Truck, Star } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl font-bebas text-white mb-8 tracking-wider">
            THE WEIGHTLIFTING<br />
            EQUIPMENT EXCHANGE
          </h1>
          
          <p className="text-2xl md:text-3xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Turn your unused gear into cash.<br />
            Buy quality equipment you can trust.
          </p>

          {/* Two Main Actions */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
            {/* Selling Path */}
            <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 backdrop-filter backdrop-blur-lg border border-emerald-700/30 rounded-2xl p-8">
              <h2 className="text-4xl font-bebas text-emerald-400 mb-4 tracking-wider">
                SELLING?
              </h2>
              <p className="text-slate-300 text-lg mb-6">
                Cash for your equipment
              </p>
              <a 
                href="/api/login" 
                className="inline-block bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-4 px-8 rounded-xl text-lg transition-colors"
              >
                Get Cash Offer
              </a>
            </div>

            {/* Buying Path */}
            <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 backdrop-filter backdrop-blur-lg border border-blue-700/30 rounded-2xl p-8">
              <h2 className="text-4xl font-bebas text-blue-400 mb-4 tracking-wider">
                BUYING?
              </h2>
              <p className="text-slate-300 text-lg mb-6">
                Verified quality gear
              </p>
              <Link href="/products">
                <span className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-xl text-lg transition-colors cursor-pointer">
                  Shop Equipment
                </span>
              </Link>
            </div>
          </div>

          {/* Trust Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">452</div>
              <div className="text-slate-400">Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400">Asheville</div>
              <div className="text-slate-400">Local</div>
            </div>
            <div className="text-3xl font-bold text-amber-400 text-center">
              <div>Cash</div>
              <div className="text-slate-400 text-base">Same Day</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">Every Item</div>
              <div className="text-slate-400">Inspected</div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Left Side - Process */}
            <div className="lg:col-span-2 space-y-8">
              <h2 className="font-bebas text-5xl text-white mb-8 tracking-wider">SIMPLE PROCESS</h2>

              {/* Sellers Process */}
              <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 backdrop-filter backdrop-blur-lg border border-emerald-700/30 rounded-2xl p-8">
                <h3 className="font-bebas text-2xl text-emerald-400 mb-6 tracking-wider">SELL YOUR EQUIPMENT</h3>
                <div className="space-y-5">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-black font-bold text-lg">1</div>
                    <span className="text-white text-lg">Submit photos online</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-black font-bold text-lg">2</div>
                    <span className="text-white text-lg">Get cash offer in 48hrs</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-black font-bold text-lg">3</div>
                    <span className="text-white text-lg">We pick up & pay cash</span>
                  </div>
                </div>
                <a 
                  href="/api/login"
                  className="inline-block mt-6 text-emerald-400 hover:text-emerald-300 font-semibold text-lg"
                >
                  Start Selling →
                </a>
              </div>

              {/* Buyers Process */}
              <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 backdrop-filter backdrop-blur-lg border border-blue-700/30 rounded-2xl p-8">
                <h3 className="font-bebas text-2xl text-blue-400 mb-6 tracking-wider">BUY QUALITY GEAR</h3>
                <div className="space-y-5">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">1</div>
                    <span className="text-white text-lg">Browse verified equipment</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">2</div>
                    <span className="text-white text-lg">Secure checkout</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">3</div>
                    <span className="text-white text-lg">Fast delivery or pickup</span>
                  </div>
                </div>
                <Link href="/products">
                  <span className="inline-block mt-6 text-blue-400 hover:text-blue-300 font-semibold text-lg cursor-pointer">
                    Start Shopping →
                  </span>
                </Link>
              </div>
            </div>

            {/* Right Side - Latest Activity */}
            <div className="space-y-6">
              <h3 className="font-bebas text-3xl text-white tracking-wider">LATEST ACTIVITY</h3>

              {/* Stats */}
              <div className="bg-gradient-to-br from-slate-800/40 to-slate-700/20 backdrop-filter backdrop-blur-lg border border-slate-600/30 rounded-2xl p-8">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-lg">Items Available</span>
                    <span className="font-bold text-blue-400 text-2xl">234</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-lg">Sold This Week</span>
                    <span className="font-bold text-emerald-400 text-2xl">18</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-lg">People Shopping</span>
                    <span className="font-bold text-amber-400 text-2xl">12</span>
                  </div>
                </div>
              </div>

              {/* Why Choose Us */}
              <div className="bg-gradient-to-br from-slate-800/40 to-slate-700/20 backdrop-filter backdrop-blur-lg border border-slate-600/30 rounded-2xl p-8">
                <h4 className="font-bebas text-xl text-white mb-4 tracking-wider">WHY CLEAN & FLIP?</h4>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Shield className="text-blue-400 w-5 h-5" />
                    <span className="text-slate-300">Every item inspected</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="text-emerald-400 w-5 h-5" />
                    <span className="text-slate-300">48hr cash offers</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Truck className="text-amber-400 w-5 h-5" />
                    <span className="text-slate-300">Free pickup & delivery</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Star className="text-purple-400 w-5 h-5" />
                    <span className="text-slate-300">Asheville trusted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}