const TOKEN_KEY = 'smart_school_access_token'

const token = sessionStorage.getItem(TOKEN_KEY)

const apiHeaders = () => ({
  Accept: 'application/json',

  ...(token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {}),
})

const escapeHtml = (value) =>
  String(value ?? '').replace(
    /[&<>'"]/g,
    (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#039;',
      '"': '&quot;',
    }[char])
  )

function showError(message) {
  const box = document.getElementById(
    'dashboardError'
  )

  if (!box) return

  box.textContent = message

  box.classList.remove('hidden')
}

function setText(id, value) {
  const element = document.getElementById(id)

  if (element) {
    element.textContent = value
  }
}

async function apiGet(url) {
  const response = await fetch(url, {
    headers: apiHeaders(),
  })

  const payload = await response
    .json()
    .catch(() => null)

  if (!response.ok || !payload?.success) {
    throw new Error(
      payload?.message ||
        `Erreur ${response.status}`
    )
  }

  return payload
}

async function loadDashboard() {
  try {
    if (!token) {
      throw new Error(
        'Session non authentifiée. Veuillez vous reconnecter.'
      )
    }

    const payload = await apiGet(
      '/api/school-admin/dashboard'
    )

    const data = payload.data
    const stats = data.statistiques

    setText(
      'schoolTitle',
      data.ecole.nom
    )

    setText(
      'schoolHeader',
      data.ecole.nom
    )

    setText(
      'schoolNameSidebar',
      data.ecole.nom
    )

    setText(
      'schoolLocationSidebar',
      data.ecole.ville || '—'
    )

    setText(
      'contextSchool',
      data.ecole.nom
    )

    setText(
      'schoolStatus',
      data.ecole.statut || '—'
    )

    setText(
      'studentsCount',
      stats.eleves
    )

    setText(
      'teachersCount',
      stats.enseignants
    )

    setText(
      'teachersSecondary',
      stats.enseignants
    )

    setText(
      'classesCount',
      stats.classes
    )

    setText(
      'subjectsCount',
      stats.matieres
    )

    setText(
      'parentsCount',
      stats.parents
    )

    setText(
      'usersCount',
      stats.utilisateurs
    )
  } catch (error) {
    showError(error.message)
  }
}

async function loadSchools() {
  const list =
    document.getElementById(
      'schoolsList'
    )

  const badge =
    document.getElementById(
      'schoolCountBadge'
    )

  if (!list) return

  try {
    const payload =
      await apiGet(
        '/api/school-admin/schools'
      )

    const schools =
      payload.data || []

    if (badge) {
      badge.textContent =
        `${schools.length} école${
          schools.length > 1
            ? 's'
            : ''
        }`
    }

    if (!schools.length) {
      list.innerHTML = `
        <div class="md:col-span-2 xl:col-span-3 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
          Aucune autre école active n’est disponible.
        </div>
      `

      return
    }

    list.innerHTML =
      schools
        .map(
          (school) => `
            <button
              type="button"
              data-school-id="${Number(
                school.id
              )}"
              class="school-switch flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 text-left hover:border-primary-300 hover:bg-primary-50"
            >
              <span class="min-w-0">
                <span class="block truncate text-sm font-bold text-slate-800">
                  ${escapeHtml(
                    school.nom
                  )}
                </span>

                <span class="mt-1 block text-xs text-slate-400">
                  ${escapeHtml(
                    school.ville ||
                      '—'
                  )}

                  ·

                  ${escapeHtml(
                    school.role ||
                      ''
                  )}
                </span>
              </span>

              <i class="fa-solid fa-arrow-right text-primary-600"></i>
            </button>
          `
        )
        .join('')

    list
      .querySelectorAll(
        '.school-switch'
      )
      .forEach((button) => {
        button.addEventListener(
          'click',
          () =>
            switchSchool(
              Number(
                button.dataset
                  .schoolId
              )
            )
        )
      })
  } catch (error) {
    if (badge) {
      badge.textContent =
        'Indisponible'
    }

    list.innerHTML = `
      <div class="md:col-span-2 xl:col-span-3 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        ${escapeHtml(
          error.message
        )}
      </div>
    `
  }
}

async function switchSchool(ecoleId) {
  try {
    const response =
      await fetch(
        '/api/auth/switch-school',
        {
          method: 'PATCH',

          headers: {
            ...apiHeaders(),
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            ecoleId,
          }),
        }
      )

    const payload =
      await response
        .json()
        .catch(() => null)

    if (
      !response.ok ||
      !payload?.success
    ) {
      throw new Error(
        payload?.message ||
          'Impossible de changer d’école.'
      )
    }

    window.location.href =
      '/school-admin/dashboard'
  } catch (error) {
    showError(error.message)
  }
}

async function logout() {
  try {
    if (token) {
      await fetch(
        '/api/auth/logout',
        {
          method: 'POST',
          headers: apiHeaders(),
        }
      )
    }
  } finally {
    sessionStorage.removeItem(
      TOKEN_KEY
    )

    window.location.href = '/'
  }
}

function setupMobileMenu() {
  const sidebar =
    document.getElementById(
      'sidebar'
    )

  const overlay =
    document.getElementById(
      'overlay'
    )

  const menuButton =
    document.getElementById(
      'menuButton'
    )

  menuButton?.addEventListener(
    'click',
    () => {
      sidebar?.classList.remove(
        '-translate-x-full'
      )

      overlay?.classList.remove(
        'hidden'
      )
    }
  )

  overlay?.addEventListener(
    'click',
    () => {
      sidebar?.classList.add(
        '-translate-x-full'
      )

      overlay?.classList.add(
        'hidden'
      )
    }
  )
}

setupMobileMenu()

document
  .getElementById(
    'logoutButton'
  )
  ?.addEventListener(
    'click',
    logout
  )

loadDashboard()
loadSchools()