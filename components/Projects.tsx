'use client';

import { useEffect, useState } from 'react';
import { 
  ExternalLink, 
  Github, 
  Code, 
  Smartphone, 
  Globe,
  ArrowRight,
  Calendar,
  Award,
  TrendingUp
} from 'lucide-react';

const Projects = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById('projects');
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, []);

  const projects = [
    {
      id: 1,
      title: "HotelBooking Pro",
      category: "Hôtellerie",
      description: "Plateforme complète de réservation hôtelière avec gestion des disponibilités en temps réel",
      image: "https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg?auto=compress&cs=tinysrgb&w=800",
      stack: ["Next.js", "Node.js", "PostgreSQL", "Redis", "Stripe"],
      features: [
        "Réservations en temps réel",
        "Paiements sécurisés",
        "Dashboard analytics",
        "API mobile-first"
      ],
      results: "+40% de réservations directes",
      duration: "3 mois",
      year: "2024",
      type: "Web App",
      githubUrl: "https://github.com",
      liveUrl: "https://demo.com",
      color: "from-blue-500 to-cyan-500"
    },
    {
      id: 2,
      title: "ImmoConnect",
      category: "Immobilier",
      description: "CRM immobilier avec intégration MLS et outils de prospection automatisée",
      image: "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800",
      stack: ["React", "Python", "MongoDB", "AWS", "WebRTC"],
      features: [
        "Gestion des annonces",
        "Visites virtuelles",
        "CRM avancé",
        "Reporting automatique"
      ],
      results: "+65% de productivité",
      duration: "4 mois",
      year: "2024",
      type: "SaaS Platform",
      githubUrl: "https://github.com",
      liveUrl: "https://demo.com",
      color: "from-purple-500 to-violet-500"
    },
    {
      id: 3,
      title: "EcoShop",
      category: "E-commerce",
      description: "Marketplace écologique avec système de recommandations IA et logistique verte",
      image: "https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=800",
      stack: ["Vue.js", "Django", "PostgreSQL", "Docker", "AI/ML"],
      features: [
        "Recommandations IA",
        "Paiements multiples",
        "Logistique optimisée",
        "App mobile native"
      ],
      results: "+120% de conversion",
      duration: "5 mois",
      year: "2023",
      type: "E-commerce",
      githubUrl: "https://github.com",
      liveUrl: "https://demo.com",
      color: "from-green-500 to-emerald-500"
    }
  ];

  const stats = [
    {
      icon: <Code className="w-8 h-8" />,
      value: "50+",
      label: "Projets terminés",
      color: "text-[#00F5FF]"
    },
    {
      icon: <Award className="w-8 h-8" />,
      value: "100%",
      label: "Satisfaction client",
      color: "text-[#9D4EDD]"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      value: "5+",
      label: "Années d'expérience",
      color: "text-[#00F5FF]"
    }
  ];

  return (
    <section id="projects" className="section-padding">
      <div className="container mx-auto px-4">
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* En-tête de section */}
          <div className="text-center mb-16">
            <h2 className="section-title text-3xl md:text-4xl font-bold mb-6">
              Mes <span className="gradient-text">projets</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Découvrez une sélection de mes réalisations récentes, des solutions innovantes qui ont transformé les entreprises de mes clients.
            </p>
          </div>

          {/* Statistiques */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {stats.map((stat, index) => (
              <div key={index} className="glass-card p-6 rounded-2xl text-center">
                <div className={`${stat.color} mb-4 flex justify-center`}>
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold gradient-text mb-2">{stat.value}</div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Projets principaux */}
          <div className="space-y-12">
            {projects.map((project, index) => (
              <div key={project.id} className={`project-card glass-card p-8 rounded-2xl border border-gray-700 ${
                index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
              } flex flex-col lg:flex gap-8 items-center`}>
                
                {/* Image du projet */}
                <div className="lg:w-1/2">
                  <div className="relative group">
                    <img 
                      src={project.image} 
                      alt={project.title}
                      className="w-full h-64 lg:h-80 object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex space-x-4">
                        <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-[#00F5FF] rounded-full hover:bg-[#0099CC] transition-colors">
                          <ExternalLink className="w-6 h-6 text-white" />
                        </a>
                        <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-[#9D4EDD] rounded-full hover:bg-[#7B2CBF] transition-colors">
                          <Github className="w-6 h-6 text-white" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contenu du projet */}
                <div className="lg:w-1/2 space-y-6">
                  <div>
                    <div className="flex items-center space-x-4 mb-3">
                      <span className="px-3 py-1 bg-[#00F5FF]/20 text-[#00F5FF] rounded-full text-sm">
                        {project.category}
                      </span>
                      <span className="text-gray-500 text-sm">{project.year}</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{project.title}</h3>
                    <p className="text-gray-400 mb-4">{project.description}</p>
                  </div>

                  {/* Infos projet */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="w-4 h-4 text-[#00F5FF]" />
                        <span className="text-sm text-gray-300">Durée</span>
                      </div>
                      <p className="text-sm text-gray-400">{project.duration}</p>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Globe className="w-4 h-4 text-[#9D4EDD]" />
                        <span className="text-sm text-gray-300">Type</span>
                      </div>
                      <p className="text-sm text-gray-400">{project.type}</p>
                    </div>
                  </div>

                  {/* Stack technique */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-gray-300">Stack technique</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.stack.map((tech, techIndex) => (
                        <span key={techIndex} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm border border-gray-600">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Fonctionnalités */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-gray-300">Fonctionnalités clés</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {project.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-[#00F5FF] rounded-full"></div>
                          <span className="text-sm text-gray-400">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Résultats */}
                  <div className="bg-gradient-to-r from-[#00F5FF]/10 to-[#9D4EDD]/10 p-4 rounded-xl">
                    <h4 className="text-sm font-semibold mb-2 text-[#00F5FF]">Résultats obtenus</h4>
                    <p className="text-white font-medium">{project.results}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Call-to-action */}
          <div className="text-center mt-16">
            <div className="glass-card p-8 rounded-2xl max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold mb-4">Intéressé par mon travail ?</h3>
              <p className="text-gray-400 mb-6">
                Explorez tous mes projets sur GitHub ou contactez-moi pour discuter de votre idée.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="btn-primary px-6 py-3 rounded-full text-white font-medium flex items-center space-x-2 hover:shadow-lg transition-all">
                  <Github className="w-5 h-5" />
                  <span>Voir GitHub</span>
                </button>
                <button className="px-6 py-3 rounded-full border border-[#00F5FF] text-[#00F5FF] hover:bg-[#00F5FF] hover:text-white transition-all flex items-center space-x-2">
                  <span>Démarrer un projet</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Projects;