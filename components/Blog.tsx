'use client';

import { useEffect, useState } from 'react';
import { 
  Calendar, 
  Clock, 
  ArrowRight, 
  Tag, 
  TrendingUp,
  BookOpen,
  Eye,
  Heart
} from 'lucide-react';

const Blog = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById('blog');
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, []);

  const articles = [
    {
      id: 1,
      title: "Next.js 14 : Les nouveautés qui révolutionnent le développement web",
      excerpt: "Découvrez les fonctionnalités révolutionnaires de Next.js 14 et comment elles transforment l'expérience développeur et utilisateur.",
      image: "https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=800",
      category: "Développement",
      date: "15 Mars 2024",
      readTime: "5 min",
      views: 1250,
      likes: 45,
      featured: true,
      tags: ["Next.js", "React", "JavaScript", "Performance"]
    },
    {
      id: 2,
      title: "Intelligence Artificielle dans le développement web : Guide pratique",
      excerpt: "Comment intégrer l'IA dans vos projets web pour automatiser les tâches et améliorer l'expérience utilisateur.",
      image: "https://images.pexels.com/photos/8386434/pexels-photo-8386434.jpeg?auto=compress&cs=tinysrgb&w=800",
      category: "IA & Tech",
      date: "8 Mars 2024",
      readTime: "7 min",
      views: 890,
      likes: 32,
      featured: false,
      tags: ["IA", "Machine Learning", "Automatisation", "UX"]
    },
    {
      id: 3,
      title: "Architecture microservices : Retour d'expérience sur un projet réel",
      excerpt: "Les leçons apprises lors de la migration d'une application monolithique vers une architecture microservices.",
      image: "https://images.pexels.com/photos/5380664/pexels-photo-5380664.jpeg?auto=compress&cs=tinysrgb&w=800",
      category: "Architecture",
      date: "1 Mars 2024",
      readTime: "10 min",
      views: 1680,
      likes: 67,
      featured: true,
      tags: ["Microservices", "Docker", "Kubernetes", "DevOps"]
    },
    {
      id: 4,
      title: "RGPD et développement web : Guide de conformité 2024",
      excerpt: "Tout ce que vous devez savoir pour développer des applications web conformes au RGPD en 2024.",
      image: "https://images.pexels.com/photos/8112199/pexels-photo-8112199.jpeg?auto=compress&cs=tinysrgb&w=800",
      category: "Sécurité",
      date: "22 Février 2024",
      readTime: "8 min",
      views: 720,
      likes: 28,
      featured: false,
      tags: ["RGPD", "Sécurité", "Conformité", "Privacy"]
    }
  ];

  const categories = [
    { name: "Développement", count: 12, color: "text-[#00F5FF]" },
    { name: "IA & Tech", count: 8, color: "text-[#9D4EDD]" },
    { name: "Architecture", count: 6, color: "text-[#00F5FF]" },
    { name: "Sécurité", count: 5, color: "text-[#9D4EDD]" }
  ];

  return (
    <section id="blog" className="section-padding">
      <div className="container mx-auto px-4">
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* En-tête de section */}
          <div className="text-center mb-16">
            <h2 className="section-title text-3xl md:text-4xl font-bold mb-6">
              Mon <span className="gradient-text">Blog</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Découvrez mes derniers articles sur les technologies web, les bonnes pratiques et les tendances du développement moderne.
            </p>
          </div>

          {/* Statistiques du blog */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="glass-card p-6 rounded-2xl text-center">
              <BookOpen className="w-8 h-8 text-[#00F5FF] mx-auto mb-4" />
              <div className="text-3xl font-bold gradient-text mb-2">31</div>
              <div className="text-gray-400">Articles publiés</div>
            </div>
            <div className="glass-card p-6 rounded-2xl text-center">
              <Eye className="w-8 h-8 text-[#9D4EDD] mx-auto mb-4" />
              <div className="text-3xl font-bold gradient-text mb-2">12.5K</div>
              <div className="text-gray-400">Vues totales</div>
            </div>
            <div className="glass-card p-6 rounded-2xl text-center">
              <TrendingUp className="w-8 h-8 text-[#00F5FF] mx-auto mb-4" />
              <div className="text-3xl font-bold gradient-text mb-2">2.3K</div>
              <div className="text-gray-400">Abonnés</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Articles */}
            <div className="lg:col-span-3">
              <div className="grid md:grid-cols-2 gap-8">
                {articles.map((article, index) => (
                  <article key={article.id} className={`blog-card glass-card rounded-2xl overflow-hidden border border-gray-700 ${
                    article.featured ? 'md:col-span-2' : ''
                  }`}>
                    <div className="relative">
                      <img 
                        src={article.image} 
                        alt={article.title}
                        className={`w-full object-cover ${article.featured ? 'h-64' : 'h-48'}`}
                      />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-[#00F5FF]/20 text-[#00F5FF] rounded-full text-sm backdrop-blur-sm">
                          {article.category}
                        </span>
                      </div>
                      {article.featured && (
                        <div className="absolute top-4 right-4">
                          <span className="px-3 py-1 bg-[#9D4EDD]/20 text-[#9D4EDD] rounded-full text-sm backdrop-blur-sm">
                            Featured
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center space-x-4 mb-4 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{article.date}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{article.readTime}</span>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold mb-3 line-clamp-2">{article.title}</h3>
                      <p className="text-gray-400 mb-4 line-clamp-3">{article.excerpt}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {article.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span key={tagIndex} className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Eye className="w-4 h-4" />
                            <span>{article.views}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart className="w-4 h-4" />
                            <span>{article.likes}</span>
                          </div>
                        </div>
                        <button className="flex items-center space-x-2 text-[#00F5FF] hover:text-[#9D4EDD] transition-colors">
                          <span>Lire plus</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Newsletter */}
              <div className="newsletter-form">
                <h3 className="text-lg font-bold mb-4">Newsletter</h3>
                <p className="text-gray-400 mb-4 text-sm">
                  Recevez mes derniers articles et tips tech directement dans votre boîte mail.
                </p>
                <div className="space-y-3">
                  <input 
                    type="email" 
                    placeholder="Votre email"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:border-[#00F5FF] focus:outline-none text-white"
                  />
                  <button className="w-full btn-primary py-2 rounded-lg text-white font-medium">
                    S'abonner
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Pas de spam. Désabonnement en 1 clic.
                </p>
              </div>

              {/* Catégories */}
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-lg font-bold mb-4">Catégories</h3>
                <div className="space-y-3">
                  {categories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className={`${category.color} font-medium`}>{category.name}</span>
                      <span className="text-gray-500 text-sm">({category.count})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags populaires */}
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-lg font-bold mb-4">Tags populaires</h3>
                <div className="flex flex-wrap gap-2">
                  {['Next.js', 'React', 'Node.js', 'TypeScript', 'IA', 'Docker', 'AWS', 'RGPD'].map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm border border-gray-600 hover:border-[#00F5FF] hover:text-[#00F5FF] transition-colors cursor-pointer">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Call-to-action */}
          <div className="text-center mt-16">
            <div className="glass-card p-8 rounded-2xl max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold mb-4">Vous avez aimé mes articles ?</h3>
              <p className="text-gray-400 mb-6">
                Abonnez-vous à ma newsletter pour ne rater aucun de mes nouveaux contenus tech.
              </p>
              <button className="btn-primary px-8 py-3 rounded-full text-white font-medium flex items-center space-x-2 mx-auto hover:shadow-lg transition-all">
                <span>S'abonner maintenant</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Blog;