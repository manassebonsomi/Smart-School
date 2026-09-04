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
  const element =
    document.getElementById(id)

  if (element) {
    element.textContent =
      value ?? '—'
  }
}

function showError(message) {
  const element =
    document.getElementById('pageError')

  if (!element) {
    return
  }

  element.textContent =
    message ||
    'Une erreur est survenue.'

  element.classList.remove(
    'hidden'
  )
}

function hideError() {
  document
    .getElementById('pageError')
    ?.classList.add('hidden')
}

function showFormError(message) {
  const element =
    document.getElementById('formError')

  if (!element) {
    return
  }

  element.textContent =
    message ||
    'Une erreur est survenue.'

  element.classList.remove(
    'hidden'
  )
}

function hideFormError() {
  document
    .getElementById('formError')
    ?.classList.add('hidden')
}

/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

async function apiRequest(
  url,
  options = {}
) {
  const response =
    await fetch(url, {
      ...options,

      headers: {
        ...apiHeaders(),
        ...(options.headers || {}),
      },
    })

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
    await apiRequest(
      '/api/auth/me'
    )

  const data =
    payload.data || {}

  const user =
    data.user || data

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
  const payload =
    await apiRequest(
      '/api/school-admin/enseignants/statistics'
    )

  const data =
    payload.data || {}

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
| LISTE
|--------------------------------------------------------------------------
*/

async function loadTeachers(
  page = 1
) {
  hideError()

  const search =
    document
      .getElementById(
        'searchInput'
      )
      ?.value
      .trim() || ''

  const statut =
    document
      .getElementById(
        'statusFilter'
      )
      ?.value || ''

  const params =
    new URLSearchParams()

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
    const payload =
      await apiRequest(
        `/api/school-admin/enseignants?${params.toString()}`
      )

    currentPage =
      page

    currentMeta =
      payload.data?.meta ||
      null

    currentTeachers =
      payload.data?.data ||
      []

    renderTeachers(
      currentTeachers
    )

    renderPagination(
      currentMeta
    )

    const total =
      Number(
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

    const metaCurrentPage =
      Number(
        currentMeta?.currentPage ||
          page
      )

    const metaPerPage =
      Number(
        currentMeta?.perPage ||
          10
      )

    const first =
      total > 0
        ? (
            metaCurrentPage -
            1
          ) *
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
| LISTE DES ENSEIGNANTS
|--------------------------------------------------------------------------
*/

function renderTeachers(
  teachers
) {
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

  if (
    !Array.isArray(
      teachers
    ) ||
    !teachers.length
  ) {
    table.innerHTML = ''

    empty.classList.remove(
      'hidden'
    )

    return
  }

  empty.classList.add(
    'hidden'
  )

  table.innerHTML =
    teachers
      .map(
        (teacher) => {
          const initials = [
            teacher.prenom?.charAt(0),
            teacher.nom?.charAt(0),
          ]
            .filter(Boolean)
            .join('')
            .toUpperCase() ||
            'EN'

          const statusActive =
            teacher.statut ===
            'ACTIF'

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
            <tr
              class="
                border-t
                border-slate-100
                transition
                hover:bg-slate-50
              "
            >

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
                    ${escapeHtml(
                      initials
                    )}
                  </div>

                  <div class="min-w-0">

                    <p
                      class="
                        truncate
                        text-sm
                        font-bold
                        text-slate-800
                      "
                    >
                      ${escapeHtml(
                        fullName
                      )}
                    </p>

                    <p
                      class="
                        mt-1
                        text-xs
                        text-slate-400
                      "
                    >
                      ${escapeHtml(
                        teacher.role ||
                          'ENSEIGNANT'
                      )}
                    </p>

                  </div>

                </div>

              </td>

              <td class="px-5 py-4">

                <p
                  class="
                    text-sm
                    text-slate-600
                  "
                >
                  ${escapeHtml(
                    teacher.email ||
                      '—'
                  )}
                </p>

                <p
                  class="
                    mt-1
                    text-xs
                    text-slate-400
                  "
                >
                  ${escapeHtml(
                    teacher.telephone ||
                      '—'
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

                <div
                  class="
                    flex
                    justify-end
                    gap-1.5
                  "
                >

                  <!-- DETAILS -->

                  <button
                    type="button"
                    title="Détails"
                    class="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-lg
                      text-primary-600
                      transition
                      hover:bg-primary-50
                    "
                    onclick="viewTeacher(${membershipId})"
                  >
                    <i
                      class="
                        fa-regular
                        fa-eye
                      "
                    ></i>
                  </button>


                  <!-- MODIFIER -->

                  <button
                    type="button"
                    title="Modifier"
                    class="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-lg
                      text-indigo-600
                      transition
                      hover:bg-indigo-50
                    "
                    onclick="editTeacher(${membershipId})"
                  >
                    <i
                      class="
                        fa-solid
                        fa-pen
                      "
                    ></i>
                  </button>


                  <!-- STATUT -->

                  ${
                    statusActive
                      ? `
                        <button
                          type="button"
                          title="Désactiver"
                          class="
                            flex
                            h-9
                            w-9
                            items-center
                            justify-center
                            rounded-lg
                            text-amber-600
                            transition
                            hover:bg-amber-50
                          "
                          onclick="changeTeacherStatus(${membershipId}, 'INACTIF')"
                        >
                          <i
                            class="
                              fa-solid
                              fa-ban
                            "
                          ></i>
                        </button>
                      `
                      : `
                        <button
                          type="button"
                          title="Activer"
                          class="
                            flex
                            h-9
                            w-9
                            items-center
                            justify-center
                            rounded-lg
                            text-emerald-600
                            transition
                            hover:bg-emerald-50
                          "
                          onclick="changeTeacherStatus(${membershipId}, 'ACTIF')"
                        >
                          <i
                            class="
                              fa-solid
                              fa-check
                            "
                          ></i>
                        </button>
                      `
                  }


                  <!-- SUPPRIMER -->

                  <button
                    type="button"
                    title="Retirer de l'école"
                    class="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-lg
                      text-red-600
                      transition
                      hover:bg-red-50
                    "
                    onclick="deleteTeacher(${membershipId})"
                  >
                    <i
                      class="
                        fa-solid
                        fa-trash-can
                      "
                    ></i>
                  </button>

                </div>

              </td>

            </tr>
          `
        }
      )
      .join('')
}

/*
|--------------------------------------------------------------------------
| PAGINATION
|--------------------------------------------------------------------------
*/

function renderPagination(
  meta
) {
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

  const current =
    Number(
      meta.currentPage
    )

  const last =
    Number(
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
        flex
        h-9
        w-9
        items-center
        justify-center
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
      if (
        page === '...'
      ) {
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
            flex
            h-9
            min-w-9
            items-center
            justify-center
            rounded-lg
            border
            border-slate-200
            px-2
            text-xs
            font-semibold
            ${
              Number(
                page
              ) === current
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
        flex
        h-9
        w-9
        items-center
        justify-center
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
      (_, index) =>
        index + 1
    )
  }

  const pages = [1]

  if (
    current > 4
  ) {
    pages.push('...')
  }

  for (
    let page =
      Math.max(
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

  if (
    current <
    last - 3
  ) {
    pages.push('...')
  }

  pages.push(last)

  return pages
}

async function goToPage(
  page
) {
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

  await loadTeachers(
    page
  )
}

/*
|--------------------------------------------------------------------------
| MODAL ENSEIGNANT EXISTANT
|--------------------------------------------------------------------------
*/

const teacherModal =
  document.getElementById(
    'teacherModal'
  )

function openModal() {
  resetTeacherForm()

  teacherModal?.classList.remove(
    'hidden'
  )

  teacherModal?.classList.add(
    'flex'
  )
}

function closeModal() {
  teacherModal?.classList.add(
    'hidden'
  )

  teacherModal?.classList.remove(
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

  const fields = {
    existingUserSearch: '',
    existingUserId: '',
    teacherPrenom: '',
    teacherNom: '',
    teacherPostnom: '',
    teacherPseudo: '',
    teacherEmail: '',
    teacherTelephone: '',
    teacherSexe: '',
    teacherPassword: '',
  }

  Object.entries(
    fields
  ).forEach(
    ([id, value]) => {
      const element =
        document.getElementById(
          id
        )

      if (element) {
        element.value =
          value
      }
    }
  )

  const results =
    document.getElementById(
      'existingUserResults'
    )

  if (results) {
    results.innerHTML =
      ''

    results.classList.add(
      'hidden'
    )
  }

  const selected =
    document.getElementById(
      'existingUserSelected'
    )

  if (selected) {
    selected.innerHTML =
      ''

    selected.classList.add(
      'hidden'
    )
  }

  updateMode()
}

function updateMode() {
  const mode =
    document.querySelector(
      'input[name="teacherMode"]:checked'
    )?.value ||
    'new'

  const newSection =
    document.getElementById(
      'newUserSection'
    )

  const existingSection =
    document.getElementById(
      'existingUserSection'
    )

  if (
    mode ===
    'existing'
  ) {
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
  const container =
    document.getElementById(
      'existingUserResults'
    )

  if (!container) {
    return
  }

  const value =
    String(
      keyword || ''
    ).trim()

  if (
    value.length < 2
  ) {
    container.innerHTML =
      ''

    container.classList.add(
      'hidden'
    )

    return
  }

  container.classList.remove(
    'hidden'
  )

  container.innerHTML = `
    <div class="px-4 py-3 text-sm text-slate-400">
      <i class="fa-solid fa-spinner fa-spin mr-2"></i>
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
      Array.isArray(
        payload.data
      )
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
    container.innerHTML = `
      <div class="px-4 py-3 text-sm text-red-500">
        ${escapeHtml(
          error.message
        )}
      </div>
    `
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

  if (
    !Array.isArray(users) ||
    !users.length
  ) {
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
      .map(
        (user) => {
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

          const initials = [
            user.prenom?.charAt(0),
            user.nom?.charAt(0),
          ]
            .filter(Boolean)
            .join('')
            .toUpperCase() ||
            'U'

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
              data-user-id="${Number(
                user.id
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
        }
      )
      .join('')

  container
    .querySelectorAll(
      'button[data-user-id]'
    )
    .forEach(
      (button) => {
        button.addEventListener(
          'click',
          async () => {
            const id =
              Number(
                button.dataset.userId
              )

            if (!id) {
              return
            }

            const user =
              users.find(
                (item) =>
                  Number(
                    item.id
                  ) === id
              )

            if (user) {
              selectExistingUser(
                user
              )
            }
          }
        )
      }
    )

  container.classList.remove(
    'hidden'
  )
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

  if (
    !hiddenId ||
    !userId
  ) {
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

  const initials = [
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

        <div
          class="
            flex
            min-w-0
            items-center
            gap-3
          "
        >

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
    resultsContainer.innerHTML =
      ''
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
    selectedContainer.innerHTML =
      ''
  }

  resultsContainer?.classList.add(
    'hidden'
  )

  if (resultsContainer) {
    resultsContainer.innerHTML =
      ''
  }
}

/*
|--------------------------------------------------------------------------
| ENREGISTREMENT ENSEIGNANT
|--------------------------------------------------------------------------
*/

async function saveTeacher() {
  const mode =
    document.querySelector(
      'input[name="teacherMode"]:checked'
    )?.value ||
    'new'

  hideFormError()

  let payload = {
    mode,
  }

  if (
    mode ===
    'existing'
  ) {
    const existingUserId =
      Number(
        document
          .getElementById(
            'existingUserId'
          )
          ?.value ||
          0
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
      ].includes(
        sexe
      )
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

  button.disabled =
    true

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

    showToast(
      'Enseignant enregistré avec succès.',
      'success'
    )
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
| MODAL DYNAMIQUE
|--------------------------------------------------------------------------
*/

function ensureUiModals() {
  if (
    document.getElementById(
      'dynamicUiRoot'
    )
  ) {
    return
  }

  const root =
    document.createElement(
      'div'
    )

  root.id =
    'dynamicUiRoot'

  root.innerHTML = `

    <!-- DETAILS -->

    <div
      id="teacherDetailsModal"
      class="
        fixed
        inset-0
        z-[100]
        hidden
        items-center
        justify-center
        bg-slate-950/50
        p-4
        backdrop-blur-sm
      "
    >

      <div
        class="
          w-full
          max-w-2xl
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-2xl
        "
      >

        <div
          class="
            flex
            items-center
            justify-between
            border-b
            border-slate-100
            px-6
            py-5
          "
        >

          <div
            class="
              flex
              items-center
              gap-3
            "
          >

            <div
              class="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-primary-50
                text-primary-600
              "
            >
              <i
                class="
                  fa-solid
                  fa-user-tie
                "
              ></i>
            </div>

            <div>

              <h3
                class="
                  text-base
                  font-bold
                  text-slate-800
                "
              >
                Détails de l’enseignant
              </h3>

              <p
                class="
                  mt-0.5
                  text-xs
                  text-slate-400
                "
              >
                Informations du compte et de l’association scolaire
              </p>

            </div>

          </div>

          <button
            type="button"
            data-close-details
            class="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-700
            "
          >
            <i
              class="
                fa-solid
                fa-xmark
              "
            ></i>
          </button>

        </div>

        <div
          id="teacherDetailsContent"
          class="
            max-h-[70vh]
            overflow-y-auto
            p-6
          "
        ></div>

      </div>

    </div>


    <!-- EDITION -->

    <div
      id="teacherEditModal"
      class="
        fixed
        inset-0
        z-[100]
        hidden
        items-center
        justify-center
        bg-slate-950/50
        p-4
        backdrop-blur-sm
      "
    >

      <div
        class="
          w-full
          max-w-2xl
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-2xl
        "
      >

        <div
          class="
            flex
            items-center
            justify-between
            border-b
            border-slate-100
            px-6
            py-5
          "
        >

          <div>

            <h3
              class="
                text-base
                font-bold
                text-slate-800
              "
            >
              Modifier l’enseignant
            </h3>

            <p
              class="
                mt-0.5
                text-xs
                text-slate-400
              "
            >
              Mettez à jour les informations du compte.
            </p>

          </div>

          <button
            type="button"
            data-close-edit
            class="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-700
            "
          >
            <i
              class="
                fa-solid
                fa-xmark
              "
            ></i>
          </button>

        </div>

        <form
          id="teacherEditForm"
          class="p-6"
        >

          <input
            id="editTeacherMembershipId"
            type="hidden"
          >

          <div
            id="editTeacherError"
            class="
              mb-5
              hidden
              rounded-xl
              border
              border-red-100
              bg-red-50
              px-4
              py-3
              text-sm
              text-red-600
            "
          ></div>

          <div
            class="
              grid
              grid-cols-1
              gap-5
              md:grid-cols-2
            "
          >

            <div>
              <label
                class="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-slate-700
                "
              >
                Prénom
              </label>

              <input
                id="editTeacherPrenom"
                type="text"
                class="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-3
                  text-sm
                  outline-none
                  transition
                  focus:border-primary-500
                  focus:ring-4
                  focus:ring-primary-50
                "
              >
            </div>


            <div>
              <label
                class="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-slate-700
                "
              >
                Nom
              </label>

              <input
                id="editTeacherNom"
                type="text"
                class="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-3
                  text-sm
                  outline-none
                  transition
                  focus:border-primary-500
                  focus:ring-4
                  focus:ring-primary-50
                "
              >
            </div>


            <div>
              <label
                class="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-slate-700
                "
              >
                Postnom
              </label>

              <input
                id="editTeacherPostnom"
                type="text"
                class="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-3
                  text-sm
                  outline-none
                  transition
                  focus:border-primary-500
                  focus:ring-4
                  focus:ring-primary-50
                "
              >
            </div>


            <div>
              <label
                class="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-slate-700
                "
              >
                E-mail
              </label>

              <input
                id="editTeacherEmail"
                type="email"
                class="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-3
                  text-sm
                  outline-none
                  transition
                  focus:border-primary-500
                  focus:ring-4
                  focus:ring-primary-50
                "
              >
            </div>


            <div>
              <label
                class="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-slate-700
                "
              >
                Téléphone
              </label>

              <input
                id="editTeacherTelephone"
                type="text"
                class="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-3
                  text-sm
                  outline-none
                  transition
                  focus:border-primary-500
                  focus:ring-4
                  focus:ring-primary-50
                "
              >
            </div>


            <div>
              <label
                class="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-slate-700
                "
              >
                Sexe
              </label>

              <select
                id="editTeacherSexe"
                class="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-3
                  text-sm
                  outline-none
                  transition
                  focus:border-primary-500
                  focus:ring-4
                  focus:ring-primary-50
                "
              >
                <option value="">
                  Non renseigné
                </option>

                <option value="HOMME">
                  Homme
                </option>

                <option value="FEMME">
                  Femme
                </option>

                <option value="AUTRE">
                  Autre
                </option>

              </select>
            </div>

          </div>


          <div
            class="
              mt-6
              flex
              justify-end
              gap-3
            "
          >

            <button
              type="button"
              data-close-edit
              class="
                rounded-xl
                border
                border-slate-200
                px-5
                py-2.5
                text-sm
                font-semibold
                text-slate-600
                hover:bg-slate-50
              "
            >
              Annuler
            </button>

            <button
              id="saveTeacherEditButton"
              type="submit"
              class="
                rounded-xl
                bg-primary-600
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
                shadow-sm
                hover:bg-primary-700
              "
            >
              Enregistrer
            </button>

          </div>

        </form>

      </div>

    </div>


    <!-- CONFIRMATION SUPPRESSION -->

    <div
      id="teacherDeleteModal"
      class="
        fixed
        inset-0
        z-[110]
        hidden
        items-center
        justify-center
        bg-slate-950/50
        p-4
        backdrop-blur-sm
      "
    >

      <div
        class="
          w-full
          max-w-md
          rounded-2xl
          bg-white
          p-6
          shadow-2xl
        "
      >

        <div
          class="
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-xl
            bg-red-50
            text-red-600
          "
        >
          <i
            class="
              fa-solid
              fa-trash-can
            "
          ></i>
        </div>

        <h3
          class="
            mt-5
            text-lg
            font-bold
            text-slate-800
          "
        >
          Retirer cet enseignant ?
        </h3>

        <p
          id="teacherDeleteMessage"
          class="
            mt-2
            text-sm
            leading-6
            text-slate-500
          "
        ></p>

        <div
          class="
            mt-6
            flex
            justify-end
            gap-3
          "
        >

          <button
            type="button"
            data-close-delete
            class="
              rounded-xl
              border
              border-slate-200
              px-5
              py-2.5
              text-sm
              font-semibold
              text-slate-600
              hover:bg-slate-50
            "
          >
            Annuler
          </button>

          <button
            id="confirmTeacherDelete"
            type="button"
            class="
              rounded-xl
              bg-red-600
              px-5
              py-2.5
              text-sm
              font-semibold
              text-white
              shadow-sm
              hover:bg-red-700
            "
          >
            Retirer l’enseignant
          </button>

        </div>

      </div>

    </div>


    <!-- TOAST -->

    <div
      id="schoolAdminToast"
      class="
        fixed
        right-5
        top-5
        z-[200]
        hidden
        max-w-sm
      "
    ></div>

  `

  document.body.appendChild(
    root
  )
}

/*
|--------------------------------------------------------------------------
| DETAILS
|--------------------------------------------------------------------------
*/

async function viewTeacher(
  membershipId
) {
  ensureUiModals()

  const modal =
    document.getElementById(
      'teacherDetailsModal'
    )

  const content =
    document.getElementById(
      'teacherDetailsContent'
    )

  if (!modal || !content) {
    return
  }

  content.innerHTML = `
    <div
      class="
        flex
        items-center
        justify-center
        py-12
        text-sm
        text-slate-400
      "
    >
      <i
        class="
          fa-solid
          fa-spinner
          fa-spin
          mr-2
        "
      ></i>

      Chargement des informations…
    </div>
  `

  modal.classList.remove(
    'hidden'
  )

  modal.classList.add(
    'flex'
  )

  try {
    const payload =
      await apiRequest(
        `/api/school-admin/enseignants/${membershipId}`
      )

    const teacher =
      payload.data || {}

    const initials = [
      teacher.prenom?.charAt(0),
      teacher.nom?.charAt(0),
    ]
      .filter(Boolean)
      .join('')
      .toUpperCase() ||
      'EN'

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

    const statusActive =
      teacher.statut ===
      'ACTIF'

    content.innerHTML = `
      <div class="space-y-6">

        <div
          class="
            flex
            items-center
            gap-4
            rounded-2xl
            bg-slate-50
            p-5
          "
        >

          <div
            class="
              flex
              h-16
              w-16
              shrink-0
              items-center
              justify-center
              rounded-2xl
              bg-primary-100
              text-lg
              font-bold
              text-primary-700
            "
          >
            ${escapeHtml(
              initials
            )}
          </div>

          <div class="min-w-0">

            <h4
              class="
                truncate
                text-lg
                font-bold
                text-slate-800
              "
            >
              ${escapeHtml(
                fullName
              )}
            </h4>

            <p
              class="
                mt-1
                text-sm
                text-slate-400
              "
            >
              ${escapeHtml(
                teacher.email ||
                  'Aucune adresse e-mail'
              )}
            </p>

          </div>

          <div class="ml-auto">

            ${
              statusActive
                ? `
                  <span
                    class="
                      inline-flex
                      rounded-full
                      bg-emerald-50
                      px-3
                      py-1.5
                      text-xs
                      font-semibold
                      text-emerald-700
                    "
                  >
                    Actif
                  </span>
                `
                : `
                  <span
                    class="
                      inline-flex
                      rounded-full
                      bg-amber-50
                      px-3
                      py-1.5
                      text-xs
                      font-semibold
                      text-amber-700
                    "
                  >
                    Inactif
                  </span>
                `
            }

          </div>

        </div>


        <div>

          <h5
            class="
              mb-3
              text-xs
              font-bold
              uppercase
              tracking-wider
              text-slate-400
            "
          >
            Informations personnelles
          </h5>

          <div
            class="
              grid
              grid-cols-1
              gap-3
              md:grid-cols-2
            "
          >

            ${detailItem(
              'Prénom',
              teacher.prenom
            )}

            ${detailItem(
              'Postnom',
              teacher.postnom
            )}

            ${detailItem(
              'Nom',
              teacher.nom
            )}

            ${detailItem(
              'Pseudo',
              teacher.pseudo
            )}

            ${detailItem(
              'E-mail',
              teacher.email
            )}

            ${detailItem(
              'Téléphone',
              teacher.telephone
            )}

            ${detailItem(
              'Sexe',
              teacher.sexe
            )}

          </div>

        </div>


        <div>

          <h5
            class="
              mb-3
              text-xs
              font-bold
              uppercase
              tracking-wider
              text-slate-400
            "
          >
            Association scolaire
          </h5>

          <div
            class="
              grid
              grid-cols-1
              gap-3
              md:grid-cols-2
            "
          >

            ${detailItem(
              'Rôle',
              teacher.role
            )}

            ${detailItem(
              'Statut',
              teacher.statut
            )}

            ${detailItem(
              'ID utilisateur',
              teacher.userId
            )}

            ${detailItem(
              'ID association',
              teacher.membershipId
            )}

          </div>

        </div>

      </div>
    `
  } catch (error) {
    content.innerHTML = `
      <div
        class="
          rounded-xl
          border
          border-red-100
          bg-red-50
          px-4
          py-4
          text-sm
          text-red-600
        "
      >
        ${escapeHtml(
          error.message
        )}
      </div>
    `
  }
}

function detailItem(
  label,
  value
) {
  return `
    <div
      class="
        rounded-xl
        border
        border-slate-100
        bg-white
        p-4
      "
    >

      <p
        class="
          text-xs
          font-medium
          text-slate-400
        "
      >
        ${escapeHtml(
          label
        )}
      </p>

      <p
        class="
          mt-1
          break-words
          text-sm
          font-semibold
          text-slate-700
        "
      >
        ${escapeHtml(
          value ||
            'Non renseigné'
        )}
      </p>

    </div>
  `
}

function closeDetailsModal() {
  const modal =
    document.getElementById(
      'teacherDetailsModal'
    )

  modal?.classList.add(
    'hidden'
  )

  modal?.classList.remove(
    'flex'
  )
}

/*
|--------------------------------------------------------------------------
| MODIFICATION
|--------------------------------------------------------------------------
*/

async function editTeacher(
  membershipId
) {
  ensureUiModals()

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

  const modal =
    document.getElementById(
      'teacherEditModal'
    )

  const membershipInput =
    document.getElementById(
      'editTeacherMembershipId'
    )

  const errorElement =
    document.getElementById(
      'editTeacherError'
    )

  membershipInput.value =
    membershipId

  errorElement.textContent =
    ''

  errorElement.classList.add(
    'hidden'
  )

  document.getElementById(
    'editTeacherPrenom'
  ).value =
    teacher.prenom || ''

  document.getElementById(
    'editTeacherNom'
  ).value =
    teacher.nom || ''

  document.getElementById(
    'editTeacherPostnom'
  ).value =
    teacher.postnom || ''

  document.getElementById(
    'editTeacherEmail'
  ).value =
    teacher.email || ''

  document.getElementById(
    'editTeacherTelephone'
  ).value =
    teacher.telephone || ''

  document.getElementById(
    'editTeacherSexe'
  ).value =
    teacher.sexe || ''

  modal.classList.remove(
    'hidden'
  )

  modal.classList.add(
    'flex'
  )
}

function closeEditModal() {
  const modal =
    document.getElementById(
      'teacherEditModal'
    )

  modal?.classList.add(
    'hidden'
  )

  modal?.classList.remove(
    'flex'
  )
}

async function submitTeacherEdit(
  event
) {
  event.preventDefault()

  const membershipId =
    Number(
      document.getElementById(
        'editTeacherMembershipId'
      )?.value || 0
    )

  if (!membershipId) {
    return
  }

  const errorElement =
    document.getElementById(
      'editTeacherError'
    )

  const button =
    document.getElementById(
      'saveTeacherEditButton'
    )

  errorElement.classList.add(
    'hidden'
  )

  const payload = {
    prenom:
      document
        .getElementById(
          'editTeacherPrenom'
        )
        .value.trim(),

    nom:
      document
        .getElementById(
          'editTeacherNom'
        )
        .value.trim(),

    postnom:
      document
        .getElementById(
          'editTeacherPostnom'
        )
        .value.trim(),

    email:
      document
        .getElementById(
          'editTeacherEmail'
        )
        .value.trim(),

    telephone:
      document
        .getElementById(
          'editTeacherTelephone'
        )
        .value.trim(),

    sexe:
      document.getElementById(
        'editTeacherSexe'
      ).value,
  }

  if (!payload.prenom) {
    errorElement.textContent =
      'Le prénom est obligatoire.'

    errorElement.classList.remove(
      'hidden'
    )

    return
  }

  if (!payload.nom) {
    errorElement.textContent =
      'Le nom est obligatoire.'

    errorElement.classList.remove(
      'hidden'
    )

    return
  }

  if (!payload.email) {
    errorElement.textContent =
      'L’adresse e-mail est obligatoire.'

    errorElement.classList.remove(
      'hidden'
    )

    return
  }

  button.disabled = true

  const originalText =
    button.textContent

  button.innerHTML = `
    <i class="fa-solid fa-spinner fa-spin mr-2"></i>
    Enregistrement…
  `

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
          JSON.stringify(
            payload
          ),
      }
    )

    closeEditModal()

    await Promise.all([
      loadStatistics(),
      loadTeachers(
        currentPage
      ),
    ])

    showToast(
      'Les informations de l’enseignant ont été mises à jour.',
      'success'
    )
  } catch (error) {
    errorElement.textContent =
      error.message

    errorElement.classList.remove(
      'hidden'
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
| STATUT
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

  const fullName =
    teacher.fullName ||
    'cet enseignant'

  const confirmed =
    window.confirm(
      `Voulez-vous ${action} ${fullName} ?`
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

    showToast(
      statut === 'ACTIF'
        ? 'Enseignant activé avec succès.'
        : 'Enseignant désactivé avec succès.',
      'success'
    )
  } catch (error) {
    showError(
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| SUPPRESSION / RETRAIT
|--------------------------------------------------------------------------
*/

let teacherToDelete = null

async function deleteTeacher(
  membershipId
) {
  ensureUiModals()

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

  teacherToDelete =
    Number(
      membershipId
    )

  const modal =
    document.getElementById(
      'teacherDeleteModal'
    )

  const message =
    document.getElementById(
      'teacherDeleteMessage'
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
    'cet enseignant'

  message.innerHTML = `
    Vous êtes sur le point de retirer
    <strong class="font-semibold text-slate-700">
      ${escapeHtml(
        fullName
      )}
    </strong>
    de cet établissement.
    <br>
    <span class="mt-2 block text-xs text-slate-400">
      Le compte utilisateur ne sera pas supprimé du système.
    </span>
  `

  modal.classList.remove(
    'hidden'
  )

  modal.classList.add(
    'flex'
  )
}

function closeDeleteModal() {
  const modal =
    document.getElementById(
      'teacherDeleteModal'
    )

  modal?.classList.add(
    'hidden'
  )

  modal?.classList.remove(
    'flex'
  )

  teacherToDelete =
    null
}

async function confirmTeacherDelete() {
  if (!teacherToDelete) {
    return
  }

  const button =
    document.getElementById(
      'confirmTeacherDelete'
    )

  const membershipId =
    teacherToDelete

  button.disabled =
    true

  const originalText =
    button.textContent

  button.innerHTML = `
    <i class="fa-solid fa-spinner fa-spin mr-2"></i>
    Retrait…
  `

  try {
    await apiRequest(
      `/api/school-admin/enseignants/${membershipId}`,
      {
        method: 'DELETE',
      }
    )

    closeDeleteModal()

    await Promise.all([
      loadStatistics(),
      loadTeachers(
        currentPage
      ),
    ])

    if (
      currentMeta &&
      currentPage >
        Number(
          currentMeta.lastPage || 1
        )
    ) {
      await loadTeachers(
        Math.max(
          1,
          currentPage - 1
        )
      )
    }

    showToast(
      'L’enseignant a été retiré de cet établissement.',
      'success'
    )
  } catch (error) {
    showToast(
      error.message,
      'error'
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
| TOAST
|--------------------------------------------------------------------------
*/

function showToast(
  message,
  type = 'success'
) {
  ensureUiModals()

  const container =
    document.getElementById(
      'schoolAdminToast'
    )

  if (!container) {
    return
  }

  const isError =
    type === 'error'

  container.innerHTML = `
    <div
      class="
        flex
        items-start
        gap-3
        rounded-2xl
        border
        ${
          isError
            ? 'border-red-100 bg-white'
            : 'border-emerald-100 bg-white'
        }
        px-4
        py-4
        shadow-xl
      "
    >

      <div
        class="
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-xl
          ${
            isError
              ? 'bg-red-50 text-red-600'
              : 'bg-emerald-50 text-emerald-600'
          }
        "
      >
        <i
          class="
            fa-solid
            ${
              isError
                ? 'fa-circle-exclamation'
                : 'fa-circle-check'
            }
          "
        ></i>
      </div>

      <div class="min-w-0 flex-1">

        <p
          class="
            text-sm
            font-semibold
            text-slate-800
          "
        >
          ${
            isError
              ? 'Erreur'
              : 'Opération réussie'
          }
        </p>

        <p
          class="
            mt-1
            text-xs
            leading-5
            text-slate-500
          "
        >
          ${escapeHtml(
            message
          )}
        </p>

      </div>

      <button
        type="button"
        onclick="this.closest('[role]')?.remove()"
        class="
          text-slate-300
          hover:text-slate-500
        "
      >
        <i class="fa-solid fa-xmark"></i>
      </button>

    </div>
  `

  const wrapper =
    container.firstElementChild

  wrapper?.setAttribute(
    'role',
    'alert'
  )

  container.classList.remove(
    'hidden'
  )

  clearTimeout(
    container._toastTimer
  )

  container._toastTimer =
    setTimeout(
      () => {
        container.classList.add(
          'hidden'
        )
      },
      4000
    )
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
          headers:
            apiHeaders(),
        }
      )
    }
  } catch {
    // La session locale sera tout de même supprimée.
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
        searchInput.value =
          ''
      }

      if (statusFilter) {
        statusFilter.value =
          ''
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
            loadTeachers(
              1
            ),
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
      loadTeachers(
        1
      )
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

/*
|--------------------------------------------------------------------------
| ÉVÉNEMENTS MODALS DYNAMIQUES
|--------------------------------------------------------------------------
*/

function setupDynamicModalEvents() {
  ensureUiModals()

  document
    .querySelectorAll(
      '[data-close-details]'
    )
    .forEach(
      (button) => {
        button.addEventListener(
          'click',
          closeDetailsModal
        )
      }
    )

  document
    .querySelectorAll(
      '[data-close-edit]'
    )
    .forEach(
      (button) => {
        button.addEventListener(
          'click',
          closeEditModal
        )
      }
    )

  document
    .querySelectorAll(
      '[data-close-delete]'
    )
    .forEach(
      (button) => {
        button.addEventListener(
          'click',
          closeDeleteModal
        )
      }
    )

  document
    .getElementById(
      'teacherEditForm'
    )
    ?.addEventListener(
      'submit',
      submitTeacherEdit
    )

  document
    .getElementById(
      'confirmTeacherDelete'
    )
    ?.addEventListener(
      'click',
      confirmTeacherDelete
    )

  document
    .getElementById(
      'teacherDetailsModal'
    )
    ?.addEventListener(
      'click',
      (event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          closeDetailsModal()
        }
      }
    )

  document
    .getElementById(
      'teacherEditModal'
    )
    ?.addEventListener(
      'click',
      (event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          closeEditModal()
        }
      }
    )

  document
    .getElementById(
      'teacherDeleteModal'
    )
    ?.addEventListener(
      'click',
      (event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          closeDeleteModal()
        }
      }
    )
}

/*
|--------------------------------------------------------------------------
| INITIALISATION
|--------------------------------------------------------------------------
*/

setupDynamicModalEvents()
setupMobileMenu()

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