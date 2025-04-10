-- Create health_coaches table
CREATE TABLE public.health_coaches (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    specialty VARCHAR(50),
    price DECIMAL(10, 2),
    rating DECIMAL(3, 1),
    reviews_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_online BOOLEAN DEFAULT FALSE,
    years_experience INTEGER,
    avatar_url TEXT,
    address TEXT,
    phone VARCHAR(50),
    website TEXT,
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on specialty for faster filtering
CREATE INDEX idx_health_coaches_specialty ON public.health_coaches(specialty);

-- Enable Row Level Security
ALTER TABLE public.health_coaches ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read
CREATE POLICY "Allow public read access" 
ON public.health_coaches 
FOR SELECT 
USING (true);

-- Create policy to allow authenticated users to insert
CREATE POLICY "Allow authenticated insert" 
ON public.health_coaches 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Create policy to allow authenticated users to update
CREATE POLICY "Allow authenticated update" 
ON public.health_coaches 
FOR UPDATE 
TO authenticated 
WITH CHECK (true); 