"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

function RedirectCountDown() {
  const router = useRouter()
  const [secondsLeft, setSecondsLeft] = useState(5)

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId)
          router.replace("https://kushkumar.me/")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(intervalId)
  }, [router])

  return (
    <div className="fixed inset-0 z-[9999] flex min-h-dvh w-screen items-center justify-center overflow-hidden bg-slate-950 px-6 text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-24 top-10 h-72 w-72 animate-pulse rounded-full bg-rose-500/25 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 animate-pulse rounded-full bg-cyan-500/20 blur-3xl [animation-delay:500ms]" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 animate-pulse rounded-full bg-amber-400/20 blur-3xl [animation-delay:900ms]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-slate-700/60 bg-slate-900/70 p-8 text-center shadow-2xl backdrop-blur-xl md:p-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-rose-300">Service Unavailable</p>
        <h1 className="text-3xl font-extrabold leading-tight text-white md:text-5xl">
          This site has no service.
        </h1>
        <p className="mt-4 text-base text-slate-300 md:text-lg">
          Redirecting to
          {" "}
          <span className="font-semibold text-cyan-300">https://kushkumar.me/</span>
          {" "}
          in
          {" "}
          <span className="font-bold text-amber-300">{secondsLeft}s</span>
          .
        </p>

        <div className="mt-8 h-2 w-full overflow-hidden rounded-full bg-slate-700/60">
          <div
            className="h-full rounded-full bg-linear-to-r from-rose-400 via-amber-300 to-cyan-300 transition-all duration-1000 ease-linear"
            style={{ width: `${(secondsLeft / 5) * 100}%` }}
          />
        </div>

        <p className="mt-3 text-xs text-slate-400">Please wait while we take you there automatically.</p>
      </div>
    </div>
  )
}

export default RedirectCountDown