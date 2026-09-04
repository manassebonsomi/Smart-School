const TOKEN_KEY = 'smart_school_access_token'

let currentPage = 1
let currentMeta = null
let currentTeachers = []

let searchTimer = null
let existingUserSearchTimer = null

const apiHeaders = () => {
  const token = sessionStorage.getItem(TOKEN_KEY)

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
    })[char]
  )

function setText(id, value) {
  const element = document.getElementById(id)

  if (element) {
    element.textContent = value ?? '—'
  }
}

function showError(message) {
  const element = document.getElementById('pageError')

  if (!element) {
    return
  }

  element.textContent = message || 'Une erreur est survenue.'
  element.classList.remove('hidden')
}

function hideError() {
  document
    .getElementById('pageError')
    ?.classList.add('hidden')
}

function showFormError(message) {
  const element = document.getElementById('formError')

  if (!element) {
    return
  }

  element.textContent = message || 'Une erreur est survenue.'
  element.classList.remove('hidden')
}

function hideFormError() {
  document
    .getElementById('formError')
    ?.classList.add('hidden')
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,

    headers: {
      ...apiHeaders(),
      ...(options.headers || {}),
    },
  })

  if (response.status === 401) {
    sessionStorage.removeItem(TOKEN_KEY)

    window.location.href = '/'

    throw new Error('Session expirée.')
  }

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

/*
|--------------------------------------------------------------------------
| UTILISATEUR CONNECTÉ
|--------------------------------------------------------------------------
*/

async function loadCurrentUser() {
  const payload = await apiRequest('/api/auth/me')

  const data = payload.data || {}
  const user = data.user || data

  const fullName = [
    user.prenom,
    user.postnom,
    user.nom,
  ]
    .filter(Boolean)
    .join(' ')
    .trim()

  const displayName =
    fullName ||
    user.pseudo ||
    user.email ||
    'Administrateur'

  setText(
    'adminGreeting',
    `Bonjour, ${user.prenom || displayName} 👋`
  )

  setText(
    'sidebarUserName',
    displayName
  )

  setText(
    'sidebarUserEmail',
    user.email || '—'
  )

  const initials = [
    user.prenom?.charAt(0),
    user.nom?.charAt(0),
  ]
    .filter(Boolean)
    .join('')
    .toUpperCase() || 'AD'

  setText(
    'sidebarUserInitials',
    initials
  )

  setText(
    'userInitials',
    initials
  )

  const schools = Array.isArray(data.ecoles)
    ? data.ecoles
    : []

  const activeSchool = schools.find(
    (school) => school.active === true
  )

  if (activeSchool) {
    setText(
      'schoolNameSidebar',
      activeSchool.nom
    )

    setText(
      'schoolLocationSidebar',
      activeSchool.ville || '—'
    )

    setText(
      'schoolHeader',
      activeSchool.nom
    )

    setText(
      'contextSchool',
      activeSchool.nom
    )
  }
}

/*
|--------------------------------------------------------------------------
| STATISTIQUES
|--------------------------------------------------------------------------
*/

async function loadStatistics() {
  const payload = await apiRequest(
    '/api/school-admin/enseignants/statistics'
  )

  const data = payload.data || {}

  setText(
    'statTotal',
    data.total ?? 0
  )

  setText(
    'statActive',
    data.actifs ?? 0
  )

  setText(
    'statInactive',
    data.inactifs ?? 0
  )
}

/*
|--------------------------------------------------------------------------
| LISTE DES ENSEIGNANTS
|--------------------------------------------------------------------------
*/

async function loadTeachers(page = 1) {
  hideError()

  const search =
    document
      .getElementById('searchInput')
      ?.value
      .trim() || ''

  const statut =
    document
      .getElementById('statusFilter')
      ?.value || ''

  const params = new URLSearchParams()

  params.set(
    'page',
    String(page)
  )

  params.set(
    'limit',
    '10'
  )

  if (search) {
    params.set(
      'search',
      search
    )
  }

  if (statut) {
    params.set(
      'statut',
      statut
    )
  }

  try {
    const payload = await apiRequest(
      `/api/school-admin/enseignants?${params.toString()}`
    )

    currentPage = page

    currentMeta =
      payload.data?.meta || null

    currentTeachers =
      payload.data?.data || []

    renderTeachers(currentTeachers)
    renderPagination(currentMeta)

    const total = Number(
      currentMeta?.total || 0
    )

    setText(
      'resultCount',
      `${total} ${
        total > 1
          ? 'enseignants'
          : 'enseignant'
      }`
    )

    const metaCurrentPage = Number(
      currentMeta?.currentPage ||
        page
    )

    const metaPerPage = Number(
      currentMeta?.perPage ||
        10
    )

    const first =
      total > 0
        ? (metaCurrentPage - 1) *
            metaPerPage +
          1
        : 0

    const last =
      total > 0
        ? Math.min(
            metaCurrentPage *
              metaPerPage,
            total
          )
        : 0

    setText(
      'paginationInfo',
      total > 0
        ? `${first}–${last} sur ${total}`
        : 'Aucun résultat'
    )
  } catch (error) {
    showError(
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| RENDU DES ENSEIGNANTS
|--------------------------------------------------------------------------
*/

function renderTeachers(teachers) {
  const table =
    document.getElementById(
      'teacherTable'
    )

  const empty =
    document.getElementById(
      'emptyState'
    )

  if (!table || !empty) {
    return
  }

  if (!Array.isArray(teachers) || !teachers.length) {
    table.innerHTML = ''

    empty.classList.remove(
      'hidden'
    )

    return
  }

  empty.classList.add(
    'hidden'
  )

  table.innerHTML = teachers
    .map((teacher) => {
      const initials = [
        teacher.prenom?.charAt(0),
        teacher.nom?.charAt(0),
      ]
        .filter(Boolean)
        .join('')
        .toUpperCase() || 'EN'

      const statusActive =
        teacher.statut === 'ACTIF'

      const membershipId =
        Number(
          teacher.membershipId
        )

      const fullName =
        teacher.fullName ||
        [
          teacher.prenom,
          teacher.postnom,
          teacher.nom,
        ]
          .filter(Boolean)
          .join(' ')
          .trim() ||
        'Enseignant'

      return `
        <tr class="border-t border-slate-100 hover:bg-slate-50">

          <td class="px-5 py-4">

            <div class="flex items-center gap-3">

              <div
                class="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-primary-50
                  text-sm
                  font-bold
                  text-primary-700
                "
              >
                ${escapeHtml(initials)}
              </div>

              <div class="min-w-0">

                <p class="truncate text-sm font-bold text-slate-800">
                  ${escapeHtml(fullName)}
                </p>

                <p class="mt-1 text-xs text-slate-400">
                  ${escapeHtml(
                    teacher.role ||
                      'ENSEIGNANT'
                  )}
                </p>

              </div>

            </div>

          </td>

          <td class="px-5 py-4">

            <p class="text-sm text-slate-600">
              ${escapeHtml(
                teacher.email || '—'
              )}
            </p>

            <p class="mt-1 text-xs text-slate-400">
              ${escapeHtml(
                teacher.telephone || '—'
              )}
            </p>

          </td>

          <td class="px-5 py-4">

            ${
              statusActive
                ? `
                  <span
                    class="
                      inline-flex
                      items-center
                      gap-2
                      rounded-full
                      bg-emerald-50
                      px-3
                      py-1.5
                      text-xs
                      font-semibold
                      text-emerald-700
                    "
                  >
                    <span
                      class="
                        h-1.5
                        w-1.5
                        rounded-full
                        bg-emerald-500
                      "
                    ></span>

                    Actif
                  </span>
                `
                : `
                  <span
                    class="
                      inline-flex
                      items-center
                      gap-2
                      rounded-full
                      bg-amber-50
                      px-3
                      py-1.5
                      text-xs
                      font-semibold
                      text-amber-700
                    "
                  >
                    <span
                      class="
                        h-1.5
                        w-1.5
                        rounded-full
                        bg-amber-500
                      "
                    ></span>

                    Inactif
                  </span>
                `
            }

          </td>

          <td class="px-5 py-4">

            <div class="flex justify-end gap-2">

              <button
                type="button"
                title="Détails"
                class="
                  h-9
                  w-9
                  rounded-lg
                  text-primary-600
                  hover:bg-primary-50
                "
                onclick="viewTeacher(${membershipId})"
              >
                <i class="fa-regular fa-eye"></i>
              </button>

              <button
                type="button"
                title="Modifier"
                class="
                  h-9
                  w-9
                  rounded-lg
                  text-indigo-600
                  hover:bg-indigo-50
                "
                onclick="editTeacher(${membershipId})"
              >
                <i class="fa-solid fa-pen"></i>
              </button>

              ${
                statusActive
                  ? `
                    <button
                      type="button"
                      title="Désactiver"
                      class="
                        h-9
                        w-9
                        rounded-lg
                        text-amber-600
                        hover:bg-amber-50
                      "
                      onclick="changeTeacherStatus(${membershipId}, 'INACTIF')"
                    >
                      <i class="fa-solid fa-ban"></i>
                    </button>
                  `
                  : `
                    <button
                      type="button"
                      title="Activer"
                      class="
                        h-9
                        w-9
                        rounded-lg
                        text-emerald-600
                        hover:bg-emerald-50
                      "
                      onclick="changeTeacherStatus(${membershipId}, 'ACTIF')"
                    >
                      <i class="fa-solid fa-check"></i>
                    </button>
                  `
              }

            </div>

          </td>

        </tr>
      `
    })
    .join('')
}

/*
|--------------------------------------------------------------------------
| PAGINATION
|--------------------------------------------------------------------------
*/

function renderPagination(meta) {
  const container =
    document.getElementById(
      'pagination'
    )

  if (!container) {
    return
  }

  if (
    !meta ||
    Number(
      meta.lastPage
    ) <= 1
  ) {
    container.innerHTML = ''
    return
  }

  const current = Number(
    meta.currentPage
  )

  const last = Number(
    meta.lastPage
  )

  const buttons = []

  buttons.push(`
    <button
      type="button"
      ${
        current <= 1
          ? 'disabled'
          : ''
      }
      onclick="goToPage(${current - 1})"
      class="
        h-9
        w-9
        rounded-lg
        border
        border-slate-200
        ${
          current <= 1
            ? 'cursor-not-allowed text-slate-300'
            : 'text-slate-600 hover:bg-slate-50'
        }
      "
    >
      <i class="fa-solid fa-chevron-left text-xs"></i>
    </button>
  `)

  const pages =
    buildPaginationPages(
      current,
      last
    )

  pages.forEach(
    (page) => {
      if (page === '...') {
        buttons.push(`
          <span class="px-1 text-slate-400">
            …
          </span>
        `)

        return
      }

      buttons.push(`
        <button
          type="button"
          onclick="goToPage(${page})"
          class="
            h-9
            min-w-9
            rounded-lg
            border
            border-slate-200
            px-2
            text-xs
            font-semibold
            ${
              Number(page) === current
                ? 'border-primary-600 bg-primary-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }
          "
        >
          ${page}
        </button>
      `)
    }
  )

  buttons.push(`
    <button
      type="button"
      ${
        current >= last
          ? 'disabled'
          : ''
      }
      onclick="goToPage(${current + 1})"
      class="
        h-9
        w-9
        rounded-lg
        border
        border-slate-200
        ${
          current >= last
            ? 'cursor-not-allowed text-slate-300'
            : 'text-slate-600 hover:bg-slate-50'
        }
      "
    >
      <i class="fa-solid fa-chevron-right text-xs"></i>
    </button>
  `)

  container.innerHTML =
    buttons.join('')
}

function buildPaginationPages(
  current,
  last
) {
  if (last <= 7) {
    return Array.from(
      {
        length: last,
      },
      (_, index) => index + 1
    )
  }

  const pages = [1]

  if (current > 4) {
    pages.push('...')
  }

  for (
    let page = Math.max(
      2,
      current - 1
    );
    page <=
    Math.min(
      last - 1,
      current + 1
    );
    page++
  ) {
    pages.push(page)
  }

  if (current < last - 3) {
    pages.push('...')
  }

  pages.push(last)

  return pages
}

async function goToPage(page) {
  if (
    page < 1 ||
    (
      currentMeta &&
      page >
        Number(
          currentMeta.lastPage
        )
    )
  ) {
    return
  }

  await loadTeachers(page)
}

/*
|--------------------------------------------------------------------------
| MODAL
|--------------------------------------------------------------------------
*/

const modal =
  document.getElementById(
    'teacherModal'
  )

function openModal() {
  resetTeacherForm()

  modal?.classList.remove(
    'hidden'
  )

  modal?.classList.add(
    'flex'
  )
}

function closeModal() {
  modal?.classList.add(
    'hidden'
  )

  modal?.classList.remove(
    'flex'
  )
}

function resetTeacherForm() {
  hideFormError()

  const newMode =
    document.querySelector(
      'input[name="teacherMode"][value="new"]'
    )

  if (newMode) {
    newMode.checked = true
  }

  const existingUserSearch =
    document.getElementById(
      'existingUserSearch'
    )

  const existingUserId =
    document.getElementById(
      'existingUserId'
    )

  const existingUserResults =
    document.getElementById(
      'existingUserResults'
    )

  const existingUserSelected =
    document.getElementById(
      'existingUserSelected'
    )

  if (existingUserSearch) {
    existingUserSearch.value = ''
  }

  if (existingUserId) {
    existingUserId.value = ''
  }

  existingUserResults?.classList.add(
    'hidden'
  )

  existingUserResults &&
    (existingUserResults.innerHTML = '')

  existingUserSelected?.classList.add(
    'hidden'
  )

  if (existingUserSelected) {
    existingUserSelected.innerHTML = ''
  }

  const fields = {
    teacherPrenom: '',
    teacherNom: '',
    teacherPostnom: '',
    teacherPseudo: '',
    teacherEmail: '',
    teacherTelephone: '',
    teacherSexe: '',
    teacherPassword: '',
  }

  Object.entries(fields).forEach(
    ([id, value]) => {
      const element =
        document.getElementById(id)

      if (element) {
        element.value = value
      }
    }
  )

  updateMode()
}

/*
|--------------------------------------------------------------------------
| MODE NOUVEAU / EXISTANT
|--------------------------------------------------------------------------
*/

function updateMode() {
  const mode =
    document.querySelector(
      'input[name="teacherMode"]:checked'
    )?.value || 'new'

  const newSection =
    document.getElementById(
      'newUserSection'
    )

  const existingSection =
    document.getElementById(
      'existingUserSection'
    )

  if (mode === 'existing') {
    newSection?.classList.add(
      'hidden'
    )

    existingSection?.classList.remove(
      'hidden'
    )

    return
  }

  existingSection?.classList.add(
    'hidden'
  )

  newSection?.classList.remove(
    'hidden'
  )
}

/*
|--------------------------------------------------------------------------
| RECHERCHE UTILISATEUR EXISTANT
|--------------------------------------------------------------------------
*/

async function searchExistingUsers(
  keyword
) {
  const resultsContainer =
    document.getElementById(
      'existingUserResults'
    )

  if (!resultsContainer) {
    return
  }

  const value =
    String(keyword || '')
      .trim()

  if (value.length < 2) {
    resultsContainer.innerHTML = ''
    resultsContainer.classList.add(
      'hidden'
    )

    return
  }

  resultsContainer.classList.remove(
    'hidden'
  )

  resultsContainer.innerHTML = `
    <div class="px-4 py-3 text-sm text-slate-400">
      Recherche en cours…
    </div>
  `

  try {
    const params =
      new URLSearchParams()

    params.set(
      'keyword',
      value
    )

    params.set(
      'limit',
      '10'
    )

    const payload =
      await apiRequest(
        `/api/school-admin/enseignants/users/search?${params.toString()}`
      )

    const users =
      Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(
            payload.data?.data
          )
        ? payload.data.data
        : []

    renderExistingUserResults(
      users
    )
  } catch (error) {
    resultsContainer.innerHTML = `
      <div class="px-4 py-3 text-sm text-red-500">
        ${escapeHtml(
          error.message
        )}
      </div>
    `

    resultsContainer.classList.remove(
      'hidden'
    )
  }
}

function renderExistingUserResults(
  users
) {
  const container =
    document.getElementById(
      'existingUserResults'
    )

  if (!container) {
    return
  }

  if (!Array.isArray(users) || !users.length) {
    container.innerHTML = `
      <div class="px-4 py-3 text-sm text-slate-400">
        Aucun utilisateur trouvé.
      </div>
    `

    container.classList.remove(
      'hidden'
    )

    return
  }

  container.innerHTML =
    users
      .map((user) => {
        const fullName =
          [
            user.prenom,
            user.postnom,
            user.nom,
          ]
            .filter(Boolean)
            .join(' ')
            .trim() ||
          user.pseudo ||
          'Utilisateur'

        const initials =
          [
            user.prenom?.charAt(0),
            user.nom?.charAt(0),
          ]
            .filter(Boolean)
            .join('')
            .toUpperCase() ||
          'U'

        const secondary =
          user.email ||
          user.telephone ||
          user.pseudo ||
          'Utilisateur'

        const userJson =
          JSON.stringify(
            user
          )
            .replace(
              /\\/g,
              '\\\\'
            )
            .replace(
              /'/g,
              '&#039;'
            )

        return `
          <button
            type="button"
            class="
              flex
              w-full
              items-center
              gap-3
              border-b
              border-slate-100
              px-4
              py-3
              text-left
              last:border-b-0
              hover:bg-slate-50
            "
            data-user="${escapeHtml(
              userJson
            )}"
          >

            <span
              class="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-lg
                bg-primary-50
                text-xs
                font-bold
                text-primary-700
              "
            >
              ${escapeHtml(
                initials
              )}
            </span>

            <span class="min-w-0">

              <span
                class="
                  block
                  truncate
                  text-sm
                  font-semibold
                  text-slate-700
                "
              >
                ${escapeHtml(
                  fullName
                )}
              </span>

              <span
                class="
                  mt-0.5
                  block
                  truncate
                  text-xs
                  text-slate-400
                "
              >
                ${escapeHtml(
                  secondary
                )}
              </span>

            </span>

          </button>
        `
      })
      .join('')

  container
    .querySelectorAll(
      'button[data-user]'
    )
    .forEach((button) => {
      button.addEventListener(
        'click',
        () => {
          let user = null

          try {
            user = JSON.parse(
              decodeHtmlEntities(
                button.dataset.user ||
                  ''
              )
            )
          } catch {
            user = null
          }

          if (user) {
            selectExistingUser(
              user
            )
          }
        }
      )
    })

  container.classList.remove(
    'hidden'
  )
}

function decodeHtmlEntities(
  value
) {
  const textarea =
    document.createElement(
      'textarea'
    )

  textarea.innerHTML =
    value

  return textarea.value
}

function selectExistingUser(
  user
) {
  const hiddenId =
    document.getElementById(
      'existingUserId'
    )

  const searchInput =
    document.getElementById(
      'existingUserSearch'
    )

  const resultsContainer =
    document.getElementById(
      'existingUserResults'
    )

  const selectedContainer =
    document.getElementById(
      'existingUserSelected'
    )

  const userId =
    Number(user.id || 0)

  if (!hiddenId || !userId) {
    return
  }

  const fullName =
    [
      user.prenom,
      user.postnom,
      user.nom,
    ]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    user.pseudo ||
    user.email ||
    'Utilisateur'

  const secondary =
    user.email ||
    user.telephone ||
    user.pseudo ||
    'Compte utilisateur'

  const initials =
    [
      user.prenom?.charAt(0),
      user.nom?.charAt(0),
    ]
      .filter(Boolean)
      .join('')
      .toUpperCase() ||
    'U'

  hiddenId.value =
    String(userId)

  if (searchInput) {
    searchInput.value =
      fullName
  }

  if (selectedContainer) {
    selectedContainer.innerHTML = `
      <div
        class="
          flex
          items-center
          justify-between
          gap-3
          rounded-xl
          border
          border-primary-100
          bg-primary-50/50
          p-3
        "
      >

        <div class="flex min-w-0 items-center gap-3">

          <div
            class="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-lg
              bg-primary-100
              text-xs
              font-bold
              text-primary-700
            "
          >
            ${escapeHtml(
              initials
            )}
          </div>

          <div class="min-w-0">

            <p
              class="
                truncate
                text-sm
                font-semibold
                text-slate-700
              "
            >
              ${escapeHtml(
                fullName
              )}
            </p>

            <p
              class="
                mt-0.5
                truncate
                text-xs
                text-slate-400
              "
            >
              ${escapeHtml(
                secondary
              )}
            </p>

          </div>

        </div>

        <button
          type="button"
          id="removeExistingUser"
          class="
            shrink-0
            rounded-lg
            px-3
            py-1.5
            text-xs
            font-semibold
            text-slate-500
            hover:bg-white
            hover:text-red-600
          "
        >
          Modifier
        </button>

      </div>
    `

    selectedContainer.classList.remove(
      'hidden'
    )

    selectedContainer
      .querySelector(
        '#removeExistingUser'
      )
      ?.addEventListener(
        'click',
        clearExistingUserSelection
      )
  }

  resultsContainer?.classList.add(
    'hidden'
  )

  if (resultsContainer) {
    resultsContainer.innerHTML = ''
  }
}

function clearExistingUserSelection() {
  const hiddenId =
    document.getElementById(
      'existingUserId'
    )

  const searchInput =
    document.getElementById(
      'existingUserSearch'
    )

  const selectedContainer =
    document.getElementById(
      'existingUserSelected'
    )

  const resultsContainer =
    document.getElementById(
      'existingUserResults'
    )

  if (hiddenId) {
    hiddenId.value = ''
  }

  if (searchInput) {
    searchInput.value = ''
    searchInput.focus()
  }

  selectedContainer?.classList.add(
    'hidden'
  )

  if (selectedContainer) {
    selectedContainer.innerHTML = ''
  }

  resultsContainer?.classList.add(
    'hidden'
  )

  if (resultsContainer) {
    resultsContainer.innerHTML = ''
  }
}

/*
|--------------------------------------------------------------------------
| ENREGISTREMENT
|--------------------------------------------------------------------------
*/

async function saveTeacher() {
  const mode =
    document.querySelector(
      'input[name="teacherMode"]:checked'
    )?.value || 'new'

  hideFormError()

  let payload = {
    mode,
  }

  if (mode === 'existing') {
    const existingUserId =
      Number(
        document
          .getElementById(
            'existingUserId'
          )
          ?.value || 0
      )

    if (!existingUserId) {
      showFormError(
        'Veuillez sélectionner un utilisateur existant.'
      )

      return
    }

    payload.userId =
      existingUserId
  } else {
    const prenom =
      document
        .getElementById(
          'teacherPrenom'
        )
        ?.value
        .trim() || ''

    const nom =
      document
        .getElementById(
          'teacherNom'
        )
        ?.value
        .trim() || ''

    const postnom =
      document
        .getElementById(
          'teacherPostnom'
        )
        ?.value
        .trim() || ''

    const pseudo =
      document
        .getElementById(
          'teacherPseudo'
        )
        ?.value
        .trim() || ''

    const email =
      document
        .getElementById(
          'teacherEmail'
        )
        ?.value
        .trim() || ''

    const telephone =
      document
        .getElementById(
          'teacherTelephone'
        )
        ?.value
        .trim() || ''

    const sexe =
      document
        .getElementById(
          'teacherSexe'
        )
        ?.value || ''

    const password =
      document.getElementById(
        'teacherPassword'
      )?.value || ''

    if (!prenom) {
      showFormError(
        'Le prénom est obligatoire.'
      )

      return
    }

    if (!nom) {
      showFormError(
        'Le nom est obligatoire.'
      )

      return
    }

    if (!email) {
      showFormError(
        'L’adresse e-mail est obligatoire.'
      )

      return
    }

    if (!password) {
      showFormError(
        'Le mot de passe est obligatoire pour un nouveau compte.'
      )

      return
    }

    if (
      sexe &&
      ![
        'HOMME',
        'FEMME',
        'AUTRE',
      ].includes(sexe)
    ) {
      showFormError(
        'La valeur du sexe sélectionnée est invalide.'
      )

      return
    }

    payload = {
      ...payload,

      prenom,
      nom,
      postnom,
      pseudo,
      email,
      telephone,
      sexe,
      password,
    }
  }

  const button =
    document.getElementById(
      'saveTeacherButton'
    )

  if (!button) {
    return
  }

  button.disabled = true

  const originalText =
    button.textContent ||
    'Enregistrer'

  button.textContent =
    'Enregistrement…'

  try {
    await apiRequest(
      '/api/school-admin/enseignants',
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify(
            payload
          ),
      }
    )

    closeModal()

    await Promise.all([
      loadStatistics(),
      loadTeachers(1),
    ])
  } catch (error) {
    showFormError(
      error.message
    )
  } finally {
    button.disabled =
      false

    button.textContent =
      originalText
  }
}

/*
|--------------------------------------------------------------------------
| DÉTAILS
|--------------------------------------------------------------------------
*/

async function viewTeacher(
  membershipId
) {
  try {
    const payload =
      await apiRequest(
        `/api/school-admin/enseignants/${membershipId}`
      )

    const teacher =
      payload.data || {}

    const details = [
      `Nom : ${
        teacher.fullName ||
        [
          teacher.prenom,
          teacher.postnom,
          teacher.nom,
        ]
          .filter(Boolean)
          .join(' ') ||
        '—'
      }`,
      `E-mail : ${
        teacher.email || '—'
      }`,
      `Téléphone : ${
        teacher.telephone || '—'
      }`,
      `Sexe : ${
        teacher.sexe || '—'
      }`,
      `Rôle : ${
        teacher.role ||
        'ENSEIGNANT'
      }`,
      `Statut : ${
        teacher.statut || '—'
      }`,
    ]

    window.alert(
      details.join('\n')
    )
  } catch (error) {
    showError(
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| MODIFICATION
|--------------------------------------------------------------------------
*/

async function editTeacher(
  membershipId
) {
  const teacher =
    currentTeachers.find(
      (item) =>
        Number(
          item.membershipId
        ) ===
        Number(
          membershipId
        )
    )

  if (!teacher) {
    showError(
      'Enseignant introuvable.'
    )

    return
  }

  const prenom =
    window.prompt(
      'Prénom',
      teacher.prenom || ''
    )

  if (prenom === null) {
    return
  }

  const nom =
    window.prompt(
      'Nom',
      teacher.nom || ''
    )

  if (nom === null) {
    return
  }

  const postnom =
    window.prompt(
      'Postnom',
      teacher.postnom || ''
    )

  if (postnom === null) {
    return
  }

  const email =
    window.prompt(
      'E-mail',
      teacher.email || ''
    )

  if (email === null) {
    return
  }

  try {
    await apiRequest(
      `/api/school-admin/enseignants/${membershipId}`,
      {
        method: 'PUT',

        headers: {
          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify({
            prenom: prenom.trim(),
            nom: nom.trim(),
            postnom: postnom.trim(),
            email: email.trim(),
          }),
      }
    )

    await Promise.all([
      loadStatistics(),
      loadTeachers(
        currentPage
      ),
    ])
  } catch (error) {
    showError(
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| CHANGEMENT DE STATUT
|--------------------------------------------------------------------------
*/

async function changeTeacherStatus(
  membershipId,
  statut
) {
  const teacher =
    currentTeachers.find(
      (item) =>
        Number(
          item.membershipId
        ) ===
        Number(
          membershipId
        )
    )

  if (!teacher) {
    showError(
      'Enseignant introuvable.'
    )

    return
  }

  const action =
    statut === 'ACTIF'
      ? 'activer'
      : 'désactiver'

  const confirmed =
    window.confirm(
      `Voulez-vous ${action} ${teacher.fullName || 'cet enseignant'} ?`
    )

  if (!confirmed) {
    return
  }

  try {
    await apiRequest(
      `/api/school-admin/enseignants/${membershipId}/statut`,
      {
        method: 'PATCH',

        headers: {
          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify({
            statut,
          }),
      }
    )

    await Promise.all([
      loadStatistics(),
      loadTeachers(
        currentPage
      ),
    ])
  } catch (error) {
    showError(
      error.message
    )
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
| LOGOUT
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
          headers: apiHeaders(),
        }
      )
    }
  } catch {
    // La session locale sera tout de même supprimée.
  } finally {
    sessionStorage.removeItem(
      TOKEN_KEY
    )

    window.location.href = '/'
  }
}

/*
|--------------------------------------------------------------------------
| EVENTS
|--------------------------------------------------------------------------
*/

document
  .getElementById(
    'addTeacherButton'
  )
  ?.addEventListener(
    'click',
    openModal
  )

document
  .getElementById(
    'closeTeacherModal'
  )
  ?.addEventListener(
    'click',
    closeModal
  )

document
  .getElementById(
    'cancelTeacherButton'
  )
  ?.addEventListener(
    'click',
    closeModal
  )

document
  .querySelectorAll(
    'input[name="teacherMode"]'
  )
  .forEach(
    (input) => {
      input.addEventListener(
        'change',
        updateMode
      )
    }
  )

document
  .getElementById(
    'saveTeacherButton'
  )
  ?.addEventListener(
    'click',
    saveTeacher
  )

document
  .getElementById(
    'resetFiltersButton'
  )
  ?.addEventListener(
    'click',
    () => {
      const searchInput =
        document.getElementById(
          'searchInput'
        )

      const statusFilter =
        document.getElementById(
          'statusFilter'
        )

      if (searchInput) {
        searchInput.value = ''
      }

      if (statusFilter) {
        statusFilter.value = ''
      }

      loadTeachers(1)
    }
  )

document
  .getElementById(
    'searchInput'
  )
  ?.addEventListener(
    'input',
    () => {
      clearTimeout(
        searchTimer
      )

      searchTimer =
        setTimeout(
          () =>
            loadTeachers(1),
          350
        )
    }
  )

document
  .getElementById(
    'statusFilter'
  )
  ?.addEventListener(
    'change',
    () =>
      loadTeachers(1)
  )

document
  .getElementById(
    'existingUserSearch'
  )
  ?.addEventListener(
    'input',
    (event) => {
      const keyword =
        event.target.value.trim()

      clearTimeout(
        existingUserSearchTimer
      )

      if (
        keyword.length < 2
      ) {
        document
          .getElementById(
            'existingUserResults'
          )
          ?.classList.add(
            'hidden'
          )

        return
      }

      existingUserSearchTimer =
        setTimeout(
          () =>
            searchExistingUsers(
              keyword
            ),
          300
        )
    }
  )

document
  .getElementById(
    'logoutButton'
  )
  ?.addEventListener(
    'click',
    logout
  )

document.addEventListener(
  'click',
  (event) => {
    const searchInput =
      document.getElementById(
        'existingUserSearch'
      )

    const resultsContainer =
      document.getElementById(
        'existingUserResults'
      )

    if (
      !searchInput ||
      !resultsContainer
    ) {
      return
    }

    if (
      event.target ===
        searchInput ||
      searchInput.contains(
        event.target
      ) ||
      resultsContainer.contains(
        event.target
      )
    ) {
      return
    }

    resultsContainer.classList.add(
      'hidden'
    )
  }
)

setupMobileMenu()

/*
|--------------------------------------------------------------------------
| INITIALISATION
|--------------------------------------------------------------------------
*/

async function initialize() {
  try {
    await loadCurrentUser()

    await Promise.all([
      loadStatistics(),
      loadTeachers(1),
    ])
  } catch (error) {
    showError(
      error.message
    )
  }
}

initialize()