
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-6"
            >
                <h1 className="text-9xl font-bold text-gold opacity-50">404</h1>
                <h2 className="text-3xl font-bold text-white">Oops! Página não encontrada.</h2>
                <p className="text-blue-100 max-w-md mx-auto">
                    A página que você está procurando pode ter sido removida, alterada ou está temporariamente indisponível.
                </p>
                <Link to="/">
                    <Button className="bg-gold hover:bg-gold-dark text-black font-bold">
                        <Home className="mr-2" /> Voltar ao Início
                    </Button>
                </Link>
            </motion.div>
        </div>
    );
}
