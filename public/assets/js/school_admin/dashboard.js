const TOKEN_KEY =
  'smart_school_access_token'

const apiHeaders = () => {
  const token =
    sessionStorage.getItem(TOKEN_KEY)

  return {
    Accept: 'application/json',

    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  }
}

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
  const box =
    document.getElementById(
      'dashboardError'
    )

  if (!box) return

  box.textContent = message

  box.classList.remove('hidden')
}

function setText(id, value) {
  const element =
    document.getElementById(id)

  if (element) {
    element.textContent =
      value ?? '—'
  }
}

/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

async function apiGet(url) {
  const response =
    await fetch(url, {
      headers: apiHeaders(),
    })

  const payload =
    await response
      .json()
      .catch(() => null)

  if (
    response.status === 401
  ) {
    sessionStorage.removeItem(
      TOKEN_KEY
    )

    window.location.href = '/'

    throw new Error(
      'Session expirée.'
    )
  }

  if (
    !response.ok ||
    !payload?.success
  ) {
    throw new Error(
      payload?.message ||
        `Erreur ${response.status}`
    )
  }

  return payload
}

/*
|--------------------------------------------------------------------------
| UTILISATEUR CONNECTÉ
|--------------------------------------------------------------------------
*/

async function loadCurrentUser() {
  const payload =
    await apiGet(
      '/api/auth/me'
    )

  const data =
    payload.data || {}

  const user =
    data.user || data

  /*
   * Nom complet
   */
  const fullName =
    [
      user.prenom,
      user.postnom,
      user.nom,
    ]
      .filter(
        Boolean
      )
      .join(' ')
      .trim()

  const displayName =
    fullName ||
    user.pseudo ||
    user.email ||
    'Administrateur'

  /*
   * Identité
   */
  setText(
    'adminName',
    displayName
  )

  setText(
    'adminFullName',
    displayName
  )

  setText(
    'adminFirstName',
    user.prenom ||
      'Administrateur'
  )

  setText(
    'adminLastName',
    user.nom || '—'
  )

  setText(
    'adminPostName',
    user.postnom || '—'
  )

  setText(
    'adminEmail',
    user.email || '—'
  )

  setText(
    'adminTelephone',
    user.telephone || '—'
  )

  /*
   * Initiales
   */
  const initials =
    [
      user.prenom?.charAt(0),
      user.nom?.charAt(0),
    ]
      .filter(Boolean)
      .join('')
      .toUpperCase() ||
    'AD'

  setText(
    'adminInitials',
    initials
  )

  /*
   * --------------------------------------------------------------------------
   * ÉCOLE ACTIVE + RÔLE
   * --------------------------------------------------------------------------
   *
   * On cherche l'école active parmi les memberships.
   */
  const schools =
    Array.isArray(
      data.ecoles
    )
      ? data.ecoles
      : []

  const activeSchool =
    schools.find(
      (school) =>
        school.active === true
    )

  if (activeSchool) {
    setText(
      'contextSchool',
      activeSchool.nom
    )

    setText(
      'schoolStatus',
      activeSchool.statut ||
        activeSchool.membershipStatus ||
        'ACTIF'
    )

    setText(
      'contextRole',
      formatRole(
        activeSchool.role
      )
    )

    setText(
      'adminRole',
      formatRole(
        activeSchool.role
      )
    )
  }
}

/*
|--------------------------------------------------------------------------
| FORMATAGE DU RÔLE
|--------------------------------------------------------------------------
*/

function formatRole(role) {
  const roles = {
    ADMIN_ECOLE:
      'Administrateur de l’école',

    ENSEIGNANT:
      'Enseignant',

    TEACHER:
      'Enseignant',

    PARENT:
      'Parent',

    ELEVE:
      'Élève',

    STUDENT:
      'Élève',

    SUPER_ADMIN:
      'Super administrateur',
  }

  return (
    roles[role] ||
    role ||
    '—'
  )
}

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/

async function loadDashboard() {
  try {
    const token =
      sessionStorage.getItem(
        TOKEN_KEY
      )

    if (!token) {
      throw new Error(
        'Session non authentifiée. Veuillez vous reconnecter.'
      )
    }

    const payload =
      await apiGet(
        '/api/school-admin/dashboard'
      )

    const data =
      payload.data || {}

    const stats =
      data.statistiques || {}

    /*
     * ÉCOLE
     */
    setText(
      'schoolTitle',
      data.ecole?.nom
    )

    setText(
      'schoolHeader',
      data.ecole?.nom
    )

    setText(
      'schoolNameSidebar',
      data.ecole?.nom
    )

    setText(
      'schoolLocationSidebar',
      data.ecole?.ville || '—'
    )

    setText(
      'contextSchool',
      data.ecole?.nom
    )

    setText(
      'schoolStatus',
      data.ecole?.statut ||
        'ACTIF'
    )

    /*
     * STATISTIQUES
     */
    setText(
      'studentsCount',
      stats.eleves ?? 0
    )

    setText(
      'teachersCount',
      stats.enseignants ?? 0
    )

    setText(
      'teachersSecondary',
      stats.enseignants ?? 0
    )

    setText(
      'classesCount',
      stats.classes ?? 0
    )

    setText(
      'subjectsCount',
      stats.matieres ?? 0
    )

    setText(
      'parentsCount',
      stats.parents ?? 0
    )

    setText(
      'usersCount',
      stats.utilisateurs ?? 0
    )
  } catch (error) {
    showError(
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| MES ÉCOLES
|--------------------------------------------------------------------------
*/

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
                    formatRole(
                      school.role
                    )
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

/*
|--------------------------------------------------------------------------
| CHANGEMENT D'ÉCOLE
|--------------------------------------------------------------------------
*/

async function switchSchool(
  ecoleId
) {
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
      response.status === 401
    ) {
      sessionStorage.removeItem(
        TOKEN_KEY
      )

      window.location.href = '/'

      return
    }

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
    showError(
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| DÉCONNEXION
|--------------------------------------------------------------------------
*/

async function logout() {
  const token =
    sessionStorage.getItem(
      TOKEN_KEY
    )

  try {
    if (token) {
      await fetch(
        '/api/auth/logout',
        {
          method: 'POST',

          headers:
            apiHeaders(),
        }
      )
    }
  } finally {
    sessionStorage.removeItem(
      TOKEN_KEY
    )

    window.location.href =
      '/'
  }
}

/*
|--------------------------------------------------------------------------
| MENU MOBILE
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| INITIALISATION
|--------------------------------------------------------------------------
*/

setupMobileMenu()

document
  .getElementById(
    'logoutButton'
  )
  ?.addEventListener(
    'click',
    logout
  )

loadCurrentUser()
loadDashboard()
loadSchools()