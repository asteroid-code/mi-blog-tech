import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const trendingTopics = [
  { topic: "GPT-5 Release", count: "2.1k menciones", trend: "+45%" },
  { topic: "Quantum Computing", count: "1.8k menciones", trend: "+32%" },
  { topic: "Tesla Bot", count: "1.5k menciones", trend: "+28%" },
  { topic: "Apple M4", count: "1.2k menciones", trend: "+19%" },
  { topic: "Meta Llama 3", count: "987 menciones", trend: "+15%" },
]

const categories = [
  { name: "Inteligencia Artificial", count: 156, color: "text-primary" },
  { name: "Machine Learning", count: 89, color: "text-secondary" },
  { name: "Blockchain", count: 67, color: "text-green-400" },
  { name: "Robótica", count: 45, color: "text-orange-400" },
  { name: "Quantum Computing", count: 34, color: "text-purple-400" },
  { name: "IoT", count: 28, color: "text-blue-400" },
]

const stats = [
  { label: "Artículos Generados", value: "12,847", change: "+23%" },
  { label: "Lectores Activos", value: "89.2k", change: "+18%" },
  { label: "Temas Cubiertos", value: "1,234", change: "+12%" },
]

export function Sidebar() {
  return (
    <div className="space-y-6">
      {/* Trending Topics */}
      <div className="bg-card rounded-xl p-6 border border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-primary text-lg">📈</span>
          <h3 className="text-lg font-bold text-foreground">Tendencias</h3>
        </div>
        <div className="space-y-3">
          {trendingTopics.map((item, index) => (
            <div key={index} className="flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-primary w-6">#{index + 1}</span>
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {item.topic}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.count}</p>
                </div>
              </div>
              <span className="text-xs text-green-400 font-medium">{item.trend}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-card rounded-xl p-6 border border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-primary text-lg">👥</span>
          <h3 className="text-lg font-bold text-foreground">Estadísticas</h3>
        </div>
        <div className="space-y-4">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
              </div>
              <span className="text-sm text-green-400 font-medium">{stat.change}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-6 border border-primary/20">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-primary text-lg">📧</span>
          <h3 className="text-lg font-bold text-foreground">Newsletter</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Recibe las últimas noticias de IA y tecnología directamente en tu inbox.
        </p>
        <div className="space-y-3">
          <Input placeholder="tu@email.com" className="bg-background/50 border-border focus:border-primary" />
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-300">
            Suscribirse
            <span className="ml-2">→</span>
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-card rounded-xl p-6 border border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-primary text-lg">#</span>
          <h3 className="text-lg font-bold text-foreground">Categorías</h3>
        </div>
        <div className="space-y-2">
          {categories.map((category, index) => (
            <div key={index} className="flex items-center justify-between group cursor-pointer py-1">
              <span className={`text-sm font-medium group-hover:${category.color} transition-colors`}>
                {category.name}
              </span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">{category.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
