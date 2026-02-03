import { redirect } from 'next/navigation'

export default function Home() {
    // Редирект на страницу логина
    redirect('/login')
}
