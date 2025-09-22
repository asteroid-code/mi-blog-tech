export function HeroSection() {
  const categories = ["IA Generativa", "Machine Learning", "Blockchain", "Quantum Computing", "Robótica", "IoT"]

  return (
    <section className="text-center mb-12 py-8">
      <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text text-balance">Noticias de Tecnología e IA</h1>
      <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
        Contenido generado automáticamente las 24 horas del día para mantenerte al día con las últimas innovaciones
      </p>

      {/* Category Pills */}
      <div className="flex flex-wrap justify-center gap-3">
        {categories.map((category) => (
          <span
            key={category}
            className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-card/50 text-card-foreground border border-primary/30 hover:border-primary hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 cursor-pointer"
          >
            {category}
          </span>
        ))}
      </div>
    </section>
  )
}
