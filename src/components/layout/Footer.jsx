export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300 mt-12 py-10 text-sm border-t-4 border-purple-600 w-full">
            <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                    <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-wider">Kurumsal</h4>
                    <ul className="space-y-2">
                        <li><a href="#" className="hover:text-purple-400 transition-colors">Hakkımızda</a></li>
                        <li><a href="#" className="hover:text-purple-400 transition-colors">Müşteri Hizmetleri</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-wider">Hizmetlerimiz</h4>
                    <ul className="space-y-2">
                        <li><a href="#" className="hover:text-purple-400 transition-colors">Güvenli e-Ticaret (GeT)</a></li>
                        <li><a href="#" className="hover:text-purple-400 transition-colors">Ekspertiz Hizmetleri</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-wider">Mağazalar</h4>
                    <ul className="space-y-2">
                        <li><a href="#" className="hover:text-purple-400 transition-colors">Mağaza Açmak İstiyorum</a></li>
                        <li><a href="#" className="hover:text-purple-400 transition-colors">Mağaza Fiyatları</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-wider">Bizi Takip Edin</h4>
                    <div className="flex gap-4 mb-4">
                        <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-purple-600 hover:text-white transition-colors">FB</a>
                        <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-purple-600 hover:text-white transition-colors">IG</a>
                    </div>
                    <p className="text-xs text-gray-500">Müşteri Hizmetleri<br/><span className="text-lg text-white font-bold">0850 XXX XX XX</span></p>
                </div>
            </div>
            <div className="max-w-[1200px] mx-auto px-4 mt-8 pt-8 border-t border-gray-800 text-xs text-center text-gray-500">
                Copyright © 2026 TeklifMeydanı. Tüm hakları saklıdır.
            </div>
        </footer>
    )
}