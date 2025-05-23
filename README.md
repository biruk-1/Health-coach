# Psychic Directory App

A React Native application built with Expo and Supabase for connecting users with psychics, astrologers, and spiritual advisors.

## Features

- User authentication (login/signup)
- Browse psychics and astrologers
- Favorite psychics
- User profiles with birth information
- Psychic verification system
- Cosmic AI for astrological insights

## Tech Stack

- **Frontend**: React Native, Expo, Expo Router
- **Backend**: Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Styling**: React Native StyleSheet

## Getting Started

### Prerequisites

- Node.js (v16+)
- Yarn or npm
- Expo CLI
- Supabase account

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   yarn install
   ```
3. Create a Supabase project at https://supabase.com
4. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update with your Supabase URL and anon key

5. Run the migrations:
   - Go to your Supabase project SQL editor
   - Run the SQL files from the `supabase/migrations` directory in order

6. Start the development server:
   ```bash
   yarn dev
   ```

## Database Schema

The application uses the following tables:

- `users` - User accounts and profile information
- `psychics` - Psychic profiles and details
- `reviews` - User reviews of psychics
- `bookings` - Session bookings between users and psychics
- `favorites` - User's favorite psychics

## Environment Variables

- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Deployment

The web version of this app can be deployed to Netlify or Vercel.

## License

This project is licensed under the MIT License.#   p s y s c - p r o  
 #   H e a l t h - c o a c h  
 