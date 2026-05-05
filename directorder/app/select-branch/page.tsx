import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { listMyBranches, setActiveBranch } from '@/lib/actions/auth'

type BranchOption = {
  id: string
  name: string
  slug: string
  address: string | null
}

export default async function SelectBranchPage() {
  const userId = cookies().get('auth-user-id')?.value
  const role = cookies().get('auth-role')?.value || 'owner'
  const homeDest = role === 'owner' ? '/admin/dashboard' : '/staff'
  if (!userId) redirect('/login')

  const data = await listMyBranches()
  if ('error' in data && data.error) redirect('/login')
  const branches = data.branches as BranchOption[]
  if (!branches || branches.length === 0) redirect('/login')
  if (branches.length === 1) {
    await setActiveBranch(branches[0].id)
    redirect(homeDest)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-black tracking-tight">Elegí sucursal</h1>
        <p className="text-white/70 mt-2">
          Tu cuenta tiene varias sucursales. Seleccioná con cuál querés trabajar ahora.
        </p>
        <div className="mt-8 grid gap-3">
          {branches.map((branch) => (
            <form key={branch.id} action={async () => {
              'use server'
              await setActiveBranch(branch.id)
              redirect(homeDest)
            }}>
              <button
                type="submit"
                className="w-full rounded-2xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] px-5 py-4 text-left"
              >
                <p className="font-bold text-lg">{branch.name}</p>
                <p className="text-sm text-white/65">
                  {branch.address || 'Sin dirección cargada'} · /{branch.slug}
                </p>
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  )
}
