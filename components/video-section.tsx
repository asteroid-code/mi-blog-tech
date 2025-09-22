const videos = [
  {
    id: 1,
    title: "El Futuro de la Inteligencia Artificial en 2025",
    thumbnail: "/ai-futuristic-interface.png",
    duration: "12:45",
    views: "2.3M",
    channel: "TechAI Español",
    description: "Descubre las tendencias más importantes de IA que transformarán el mundo tecnológico este año.",
  },
  {
    id: 2,
    title: "ChatGPT vs Claude: Comparativa Completa",
    thumbnail: "/ai-chatbot-comparison-interface.jpg",
    duration: "8:32",
    views: "1.8M",
    channel: "IA Review",
    description: "Análisis detallado de las capacidades y diferencias entre los principales modelos de IA.",
  },
  {
    id: 3,
    title: "Cómo la IA Está Revolucionando el Desarrollo",
    thumbnail: "/programming-code-ai-assistant.jpg",
    duration: "15:20",
    views: "956K",
    channel: "DevAI Pro",
    description: "Herramientas de IA que están cambiando la forma en que los desarrolladores escriben código.",
  },
  {
    id: 4,
    title: "Machine Learning Explicado en 10 Minutos",
    thumbnail: "/ml-neural-network-visualization.png",
    duration: "10:15",
    views: "3.1M",
    channel: "Ciencia IA",
    description: "Una introducción clara y concisa a los conceptos fundamentales del aprendizaje automático.",
  },
  {
    id: 5,
    title: "IA Generativa: Más Allá del Texto e Imágenes",
    thumbnail: "/generative-ai-creating-multimedia-content.jpg",
    duration: "18:47",
    views: "1.2M",
    channel: "Futuro Digital",
    description: "Exploramos las nuevas fronteras de la IA generativa en video, audio y contenido 3D.",
  },
]

export function VideoSection() {
  return (
    <section className="py-12">
      <div className="mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent mb-2">
          Videos Destacados
        </h2>
        <p className="text-muted-foreground">
          Los mejores contenidos en video sobre inteligencia artificial y tecnología
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {videos.map((video) => (
          <div
            key={video.id}
            className="group cursor-pointer bg-card/50 backdrop-blur-sm rounded-xl overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden">
              <img
                src={video.thumbnail || "/placeholder.svg"}
                alt={video.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-primary/90 rounded-full p-3">
                  <span className="text-white text-xl">▶</span>
                </div>
              </div>

              {/* Duration Badge */}
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <span>🕒</span>
                {video.duration}
              </div>
            </div>

            {/* Video Info */}
            <div className="p-4">
              <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                {video.title}
              </h3>

              <div className="text-xs text-muted-foreground mb-2">
                <p className="font-medium text-foreground">{video.channel}</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <span>👁</span>
                <span>{video.views} visualizaciones</span>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2">{video.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* View All Button */}
      <div className="text-center mt-8">
        <button className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
          Ver Todos los Videos
        </button>
      </div>
    </section>
  )
}
