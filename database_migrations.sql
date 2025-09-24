-- Extend the 'profiles' table
ALTER TABLE profiles
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN current_plan TEXT DEFAULT 'free',
ADD COLUMN subscription_status TEXT DEFAULT 'inactive';

-- Create the 'subscriptions' table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    plan_type TEXT NOT NULL,
    status TEXT NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for subscriptions table
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subscriptions table
CREATE POLICY "Users can view their own subscriptions." ON subscriptions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions." ON subscriptions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions." ON subscriptions
FOR UPDATE USING (auth.uid() = user_id);

-- Optional: Add an index to user_id for faster lookups
CREATE INDEX ON subscriptions (user_id);

-- Agregar categorías específicas de IA
INSERT INTO categories (name, slug, description) VALUES
('Inteligencia Artificial', 'ia', 'Todo sobre IA y machine learning'),
('Prompt Engineering', 'prompt-engineering', 'Técnicas de ingeniería de prompts'),
('Computer Vision', 'computer-vision', 'Visión por computadora y CV'),
('NLP', 'nlp', 'Procesamiento de lenguaje natural'),
('AI Ethics', 'ai-ethics', 'Ética e implicaciones sociales de la IA');
