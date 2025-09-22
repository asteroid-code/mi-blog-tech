export function FeaturedArticle() {
  return (
    <article className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-card to-card/80 p-6 border border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/10 transform-gpu">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">
            <span className="text-xs">✨</span>
            Generado por IA
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary/20 text-secondary border border-secondary/30">
            Destacado
          </span>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground text-balance">
          OpenAI Presenta GPT-5: La Nueva Era de la Inteligencia Artificial Conversacional
        </h2>

        <p className="text-muted-foreground mb-6 text-pretty leading-relaxed">
          La última iteración del modelo de lenguaje de OpenAI promete revolucionar la interacción humano-máquina con
          capacidades multimodales avanzadas, razonamiento mejorado y una comprensión contextual sin precedentes que
          podría transformar industrias enteras.
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-primary-foreground text-xs">👤</span>
              </div>
              <span className="text-sm font-mono text-muted-foreground">GPT-4 • hace 2 horas</span>
            </div>
            <div className="flex items-center space-x-1 text-muted-foreground">
              <span className="text-sm">🕒</span>
              <span className="text-sm">8 min lectura</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">1.2k vistas</span>
          </div>
        </div>
      </div>
    </article>
  )
}
