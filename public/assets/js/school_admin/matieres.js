/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const TOKEN_KEY =
    'smart_school_access_token'


/*
|--------------------------------------------------------------------------
| ÉTAT
|--------------------------------------------------------------------------
*/

let currentUser =
    null

let currentContext =
    null

let currentSchool =
    null

let currentPage =
    1

let currentMeta =
    null

let currentSubjects =
    []

let editingSubjectId =
    null

let subjectToDelete =
    null

let confirmCallback =
    null

let searchTimer =
    null

let toastTimer =
    null


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function getToken() {

    return sessionStorage.getItem(
        TOKEN_KEY
    )
}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        )

    if (element) {

        element.textContent =
            value ?? '—'
    }
}


function formatNumber(
    value
) {

    return new Intl.NumberFormat(
        'fr-FR'
    ).format(
        Number(
            value || 0
        )
    )
}


function formatDate(
    value
) {

    if (!value) {
        return '—'
    }

    const date =
        new Date(value)

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return '—'
    }

    return new Intl.DateTimeFormat(
        'fr-FR',
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }
    ).format(
        date
    )
}


function escapeHtml(
    value
) {

    const element =
        document.createElement(
            'div'
        )

    element.textContent =
        value ?? ''

    return element.innerHTML
}


function getInitials(
    user
) {

    const prenom =
        String(
            user?.prenom ||
            ''
        ).trim()

    const nom =
        String(
            user?.nom ||
            ''
        ).trim()

    const initials =
        `${prenom.charAt(0)}${nom.charAt(0)}`

    return (
        initials
            .toUpperCase() ||
        'SA'
    )
}


function getFullName(
    user
) {

    const fullName =
        [
            user?.prenom,
            user?.nom,
        ]
            .filter(Boolean)
            .join(' ')
            .trim()

    return (
        fullName ||
        user?.fullName ||
        'Administrateur'
    )
}


function getSchoolLocation(
    school
) {

    if (!school) {
        return '—'
    }

    const location =
        [
            school.ville,
            school.commune,
            school.quartier,
        ]
            .filter(Boolean)
            .join(' · ')

    return (
        location ||
        school.adresse ||
        school.province ||
        school.pays ||
        '—'
    )
}


function normalizeStatus(
    value
) {

    return String(
        value || ''
    )
        .trim()
        .toUpperCase()
}


function showPageError(
    message
) {

    const element =
        document.getElementById(
            'pageError'
        )

    if (!element) {
        return
    }

    element.textContent =
        message

    element.classList.remove(
        'hidden'
    )
}


function hidePageError() {

    document
        .getElementById(
            'pageError'
        )
        ?.classList.add(
            'hidden'
        )
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

    const token =
        getToken()

    if (!token) {

        sessionStorage.clear()

        window.location.replace('/')

        throw new Error(
            'Session expirée.'
        )
    }


    const response =
        await fetch(
            url,
            {
                ...options,

                headers: {
                    Accept:
                        'application/json',

                    Authorization:
                        `Bearer ${token}`,

                    ...(options.headers || {}),
                },
            }
        )


    if (
        response.status ===
        401
    ) {

        sessionStorage.clear()

        window.location.replace('/')

        throw new Error(
            'Session expirée.'
        )
    }


    return response
}


async function parseResponse(
    response
) {

    return response
        .json()
        .catch(
            () => null
        )
}


/*
|--------------------------------------------------------------------------
| UTILISATEUR + ÉCOLE ACTIVE
|--------------------------------------------------------------------------
*/

async function loadCurrentUser() {

    const response =
        await apiRequest(
            '/api/auth/me'
        )

    const result =
        await parseResponse(
            response
        )

    if (
        !response.ok ||
        !result?.success
    ) {
        throw new Error(
            result?.message ||
            'Impossible de récupérer les informations de votre session.'
        )
    }

    /*
     * IMPORTANT :
     * /api/auth/me retourne les informations
     * dans result.data.
     */

    const data =
        result.data ||
        {}


    currentUser =
        data.user ||
        null


    currentContext =
        data.context ||
        data.contexte ||
        null


    /*
     * Les éléments de data.ecoles sont des
     * EcoleUser avec la relation "ecole".
     */

    const memberships =
        Array.isArray(
            data.ecoles
        )
            ? data.ecoles
            : []


    /*
     * Chercher le membership correspondant
     * au contexte actif.
     */

    let activeMembership =
        null


    if (
        currentContext?.ecoleId
    ) {

        activeMembership =
            memberships.find(
                membership =>
                    Number(
                        membership.ecoleId
                    ) === Number(
                        currentContext.ecoleId
                    )
            )
    }


    /*
     * Fallback :
     * certains retours peuvent exposer l'école
     * directement dans context.ecole.
     */

    currentSchool =
        activeMembership?.ecole ||
        currentContext?.ecole ||
        null


    /*
     * Dernier fallback :
     * prendre le premier établissement actif.
     */

    if (!currentSchool) {

        const firstMembership =
            memberships[0]

        currentSchool =
            firstMembership?.ecole ||
            null
    }


    /*
     * Si le contexte n'a pas encore d'école
     * mais qu'il existe un membership, récupérer
     * également le rôle depuis celui-ci.
     */

    if (
        currentContext &&
        !currentContext.role &&
        activeMembership?.role
    ) {

        currentContext.role =
            activeMembership.role
    }


    console.log(
        'Smart School /auth/me:',
        {
            user:
                currentUser,

            context:
                currentContext,

            memberships:
                memberships,

            activeSchool:
                currentSchool,
        }
    )


    renderCurrentUser()

    renderCurrentSchool()


    return {
        user:
            currentUser,

        context:
            currentContext,

        school:
            currentSchool,
    }
}


/*
|--------------------------------------------------------------------------
| UTILISATEUR
|--------------------------------------------------------------------------
*/

function renderCurrentUser() {

    if (!currentUser) {

        console.warn(
            'Aucun utilisateur retourné par /api/auth/me'
        )

        return
    }


    const fullName =
        [
            currentUser.prenom,
            currentUser.postnom,
            currentUser.nom,
        ]
            .filter(
                value =>
                    value &&
                    String(value).trim()
            )
            .join(' ')
            .replace(
                /\s+/g,
                ' '
            )
            .trim()


    const initials =
        (
            `${currentUser.prenom || ''}${currentUser.nom || ''}`
        )
            .replace(
                /\s+/g,
                ''
            )
            .slice(
                0,
                2
            )
            .toUpperCase()
        ||
        'SS'


    const displayName =
        fullName ||
        currentUser.pseudo ||
        'Utilisateur'


    const email =
        currentUser.email ||
        '—'


    /*
     * SIDEBAR
     */

    setText(
        'sidebarUserInitials',
        initials
    )

    setText(
        'sidebarUserName',
        displayName
    )

    setText(
        'sidebarUserEmail',
        email
    )


    /*
     * HEADER
     */

    setText(
        'headerUserInitials',
        initials
    )

    setText(
        'headerUserName',
        displayName
    )

    setText(
        'headerUserEmail',
        email
    )
}


/*
|--------------------------------------------------------------------------
| ÉCOLE ACTIVE
|--------------------------------------------------------------------------
*/

function renderCurrentSchool() {

    /*
     * Il peut arriver que le backend fournisse
     * directement context.ecole.
     */

    const school =
        currentSchool ||
        currentContext?.ecole ||
        null


    if (!school) {

        console.warn(
            'Aucune école active trouvée dans /api/auth/me',
            {
                context:
                    currentContext,

                user:
                    currentUser,
            }
        )


        setText(
            'schoolNameSidebar',
            'Établissement'
        )

        setText(
            'schoolLocationSidebar',
            'Aucun établissement actif'
        )

        setText(
            'schoolBadgeName',
            'Établissement'
        )

        return
    }


    currentSchool =
        school


    const schoolName =
        school.nom ||
        school.name ||
        'Établissement'


    const locationParts =
        [
            school.ville,
            school.commune,
            school.quartier,
        ]
            .filter(
                value =>
                    value &&
                    String(value).trim()
            )


    const location =
        locationParts.length
            ? locationParts.join(' · ')
            : (
                school.adresse ||
                school.province ||
                school.pays ||
                'Localisation non renseignée'
            )


    /*
     * SIDEBAR
     */

    setText(
        'schoolNameSidebar',
        schoolName
    )


    setText(
        'schoolLocationSidebar',
        location
    )


    /*
     * PAGE
     */

    setText(
        'schoolBadgeName',
        schoolName
    )
}


/*
|--------------------------------------------------------------------------
| STATISTIQUES
|--------------------------------------------------------------------------
*/

async function loadStatistics() {

    const response =
        await apiRequest(
            '/api/school-admin/matieres/statistics'
        )


    const result =
        await parseResponse(
            response
        )


    if (
        !response.ok ||
        !result?.success
    ) {

        throw new Error(
            result?.message ||
            'Impossible de charger les statistiques.'
        )
    }


    const data =
        result.data ||
        {}


    const total =
        Number(
            data.total ||
            0
        )


    const actifs =
        Number(
            data.actifs ||
            0
        )


    const inactifs =
        Number(
            data.inactifs ||
            0
        )


    let taux =
        0


    if (total > 0) {

        taux =
            Math.round(
                (
                    actifs /
                    total
                ) *
                100
            )
    }


    setText(
        'statTotal',
        formatNumber(
            total
        )
    )


    setText(
        'statActive',
        formatNumber(
            actifs
        )
    )


    setText(
        'statInactive',
        formatNumber(
            inactifs
        )
    )


    setText(
        'statActivePercent',
        `${taux}% du total`
    )


    setText(
        'statActivationRate',
        `${taux}%`
    )
}


/*
|--------------------------------------------------------------------------
| MATIÈRES
|--------------------------------------------------------------------------
*/

async function loadSubjects(
    page = 1
) {

    const search =
        document
            .getElementById(
                'searchInput'
            )
            ?.value
            ?.trim() ||
        ''


    const status =
        document
            .getElementById(
                'statusFilter'
            )
            ?.value ||
        ''


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


    if (status) {

        params.set(
            'statut',
            status
        )
    }


    renderSubjectsLoading()


    try {

        const response =
            await apiRequest(
                `/api/school-admin/matieres?${params.toString()}`
            )


        const result =
            await parseResponse(
                response
            )


        if (
            !response.ok ||
            !result?.success
        ) {

            throw new Error(
                result?.message ||
                'Impossible de charger les matières.'
            )
        }


        const data =
            result.data ||
            {}


        currentSubjects =
            Array.isArray(
                data.data
            )
                ? data.data
                : []


        currentMeta =
            data.meta ||
            null


        currentPage =
            Number(
                currentMeta?.currentPage ||
                currentMeta?.current_page ||
                page
            )


        renderSubjects()

        renderPagination()

        hidePageError()

    } catch (error) {

        console.error(
            'loadSubjects:',
            error
        )

        renderSubjectsError(
            error.message
        )

        showPageError(
            error.message
        )
    }
}


function renderSubjectsLoading() {

    const body =
        document.getElementById(
            'subjectsTableBody'
        )

    if (!body) {
        return
    }


    body.innerHTML = `

        <tr>

            <td
                colspan="4"
                class="
                    px-6
                    py-14
                    text-center
                "
            >

                <div
                    class="
                        inline-flex
                        items-center
                        gap-3
                        text-sm
                        text-slate-400
                    "
                >

                    <i
                        class="
                            fa-solid
                            fa-spinner
                            fa-spin
                            text-sky-500
                        "
                    ></i>

                    Chargement des matières…

                </div>

            </td>

        </tr>

    `
}


function renderSubjectsError(
    message
) {

    const body =
        document.getElementById(
            'subjectsTableBody'
        )

    if (!body) {
        return
    }


    body.innerHTML = `

        <tr>

            <td
                colspan="4"
                class="
                    px-6
                    py-14
                    text-center
                "
            >

                <div
                    class="
                        mx-auto
                        flex
                        h-12
                        w-12
                        items-center
                        justify-center
                        rounded-xl
                        bg-red-50
                        text-red-500
                    "
                >
                    <i
                        class="
                            fa-solid
                            fa-circle-exclamation
                        "
                    ></i>
                </div>

                <p
                    class="
                        mt-4
                        text-sm
                        font-semibold
                        text-slate-700
                    "
                >
                    Impossible de charger les matières
                </p>

                <p
                    class="
                        mt-1
                        text-xs
                        text-slate-400
                    "
                >
                    ${escapeHtml(message)}
                </p>

                <button
                    type="button"
                    onclick="loadSubjects(${currentPage || 1})"
                    class="
                        mt-4
                        rounded-lg
                        bg-sky-50
                        px-4
                        py-2
                        text-xs
                        font-semibold
                        text-sky-600
                        hover:bg-sky-100
                    "
                >
                    Réessayer
                </button>

            </td>

        </tr>

    `
}


function renderSubjects() {

    const body =
        document.getElementById(
            'subjectsTableBody'
        )

    if (!body) {
        return
    }


    if (
        !currentSubjects.length
    ) {

        body.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="
                        px-6
                        py-14
                        text-center
                    "
                >

                    <div
                        class="
                            mx-auto
                            flex
                            h-14
                            w-14
                            items-center
                            justify-center
                            rounded-2xl
                            bg-sky-50
                            text-sky-500
                        "
                    >
                        <i
                            class="
                                fa-solid
                                fa-book-open
                            "
                        ></i>
                    </div>

                    <p
                        class="
                            mt-4
                            text-sm
                            font-semibold
                            text-slate-700
                        "
                    >
                        Aucune matière trouvée
                    </p>

                    <p
                        class="
                            mt-1
                            text-xs
                            text-slate-400
                        "
                    >
                        Modifiez vos critères ou ajoutez une nouvelle matière.
                    </p>

                    <button
                        type="button"
                        onclick="openCreateModal()"
                        class="
                            mt-4
                            inline-flex
                            items-center
                            gap-2
                            rounded-lg
                            bg-sky-50
                            px-4
                            py-2
                            text-xs
                            font-semibold
                            text-sky-600
                            hover:bg-sky-100
                        "
                    >
                        <i class="fa-solid fa-plus"></i>
                        Nouvelle matière
                    </button>

                </td>

            </tr>

        `

        updatePaginationInfo()

        return
    }


    body.innerHTML =
        currentSubjects
            .map(
                subject =>
                    renderSubjectRow(
                        subject
                    )
            )
            .join('')


    updatePaginationInfo()
}


function renderSubjectRow(
    subject
) {

    const id =
        Number(
            subject.id
        )


    const name =
        escapeHtml(
            subject.nom ||
            'Sans nom'
        )


    const description =
        escapeHtml(
            subject.description ||
            'Aucune description'
        )


    const status =
        normalizeStatus(
            subject.statut
        )


    const statusHtml =
        status === 'ACTIVE'
            ? `
                <span
                    class="
                        inline-flex
                        items-center
                        gap-1.5
                        rounded-full
                        bg-emerald-50
                        px-2.5
                        py-1
                        text-xs
                        font-semibold
                        text-emerald-600
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

                    Active
                </span>
            `
            : `
                <span
                    class="
                        inline-flex
                        items-center
                        gap-1.5
                        rounded-full
                        bg-slate-100
                        px-2.5
                        py-1
                        text-xs
                        font-semibold
                        text-slate-500
                    "
                >
                    <span
                        class="
                            h-1.5
                            w-1.5
                            rounded-full
                            bg-slate-400
                        "
                    ></span>

                    Inactive
                </span>
            `


    return `

        <tr
            class="
                transition
                hover:bg-slate-50/80
            "
        >

            <!-- MATIÈRE -->

            <td
                class="
                    px-6
                    py-4
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
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl
                            bg-sky-50
                            text-sky-600
                        "
                    >
                        <i
                            class="
                                fa-solid
                                fa-book-open
                            "
                        ></i>
                    </div>


                    <div class="min-w-0">

                        <p
                            class="
                                truncate
                                text-sm
                                font-semibold
                                text-slate-800
                            "
                        >
                            ${name}
                        </p>

                        <p
                            class="
                                mt-0.5
                                text-xs
                                text-slate-400
                            "
                        >
                            Matière #${id}
                        </p>

                    </div>

                </div>

            </td>


            <!-- DESCRIPTION -->

            <td
                class="
                    max-w-md
                    px-6
                    py-4
                "
            >

                <p
                    class="
                        line-clamp-2
                        text-sm
                        text-slate-500
                    "
                >
                    ${description}
                </p>

            </td>


            <!-- STATUS -->

            <td
                class="
                    px-6
                    py-4
                "
            >
                ${statusHtml}
            </td>


            <!-- ACTIONS -->

            <td
                class="
                    px-6
                    py-4
                    text-right
                "
            >

                <div
                    class="
                        inline-flex
                        items-center
                        gap-1
                    "
                >

                    <button
                        type="button"
                        onclick="viewSubject(${id})"
                        class="
                            flex
                            h-9
                            w-9
                            items-center
                            justify-center
                            rounded-lg
                            text-slate-400
                            transition
                            hover:bg-sky-50
                            hover:text-sky-600
                        "
                        title="Voir"
                    >
                        <i
                            class="
                                fa-solid
                                fa-eye
                            "
                        ></i>
                    </button>


                    <button
                        type="button"
                        onclick="editSubject(${id})"
                        class="
                            flex
                            h-9
                            w-9
                            items-center
                            justify-center
                            rounded-lg
                            text-slate-400
                            transition
                            hover:bg-sky-50
                            hover:text-sky-600
                        "
                        title="Modifier"
                    >
                        <i
                            class="
                                fa-solid
                                fa-pen
                            "
                        ></i>
                    </button>


                    <button
                        type="button"
                        onclick="changeSubjectStatus(${id})"
                        class="
                            flex
                            h-9
                            w-9
                            items-center
                            justify-center
                            rounded-lg
                            text-slate-400
                            transition
                            hover:bg-amber-50
                            hover:text-amber-600
                        "
                        title="${
                            status === 'ACTIVE'
                                ? 'Désactiver'
                                : 'Activer'
                        }"
                    >
                        <i
                            class="
                                fa-solid
                                ${
                                    status === 'ACTIVE'
                                        ? 'fa-toggle-on'
                                        : 'fa-toggle-off'
                                }
                            "
                        ></i>
                    </button>


                    <button
                        type="button"
                        onclick="deleteSubject(${id})"
                        class="
                            flex
                            h-9
                            w-9
                            items-center
                            justify-center
                            rounded-lg
                            text-slate-400
                            transition
                            hover:bg-red-50
                            hover:text-red-600
                        "
                        title="Supprimer"
                    >
                        <i
                            class="
                                fa-solid
                                fa-trash
                            "
                        ></i>
                    </button>

                </div>

            </td>

        </tr>

    `
}


/*
|--------------------------------------------------------------------------
| PAGINATION
|--------------------------------------------------------------------------
*/

function updatePaginationInfo() {

    const element =
        document.getElementById(
            'paginationInfo'
        )

    if (!element) {
        return
    }


    const total =
        Number(
            currentMeta?.total ||
            0
        )


    const perPage =
        Number(
            currentMeta?.perPage ||
            currentMeta?.per_page ||
            10
        )


    const page =
        Number(
            currentMeta?.currentPage ||
            currentMeta?.current_page ||
            currentPage ||
            1
        )


    if (!total) {

        element.textContent =
            'Aucun résultat'

        return
    }


    const from =
        (
            (
                page -
                1
            ) *
            perPage
        ) +
        1


    const to =
        Math.min(
            page * perPage,
            total
        )


    element.textContent =
        `${formatNumber(from)}–${formatNumber(to)} sur ${formatNumber(total)}`
}


function renderPagination() {

    const container =
        document.getElementById(
            'pagination'
        )

    if (!container) {
        return
    }


    const lastPage =
        Number(
            currentMeta?.lastPage ||
            currentMeta?.last_page ||
            1
        )


    const current =
        Number(
            currentMeta?.currentPage ||
            currentMeta?.current_page ||
            currentPage ||
            1
        )


    if (
        lastPage <= 1
    ) {

        container.innerHTML =
            ''

        return
    }


    const pages =
        buildPaginationPages(
            current,
            lastPage
        )


    const html =
        []


    html.push(`

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
                        : 'text-slate-600 hover:bg-sky-50'
                }
            "
        >
            <i
                class="
                    fa-solid
                    fa-chevron-left
                    text-xs
                "
            ></i>
        </button>

    `)


    pages.forEach(
        page => {

            if (page === '...') {

                html.push(`

                    <span
                        class="
                            flex
                            h-9
                            w-9
                            items-center
                            justify-center
                            text-sm
                            text-slate-400
                        "
                    >
                        …
                    </span>

                `)

                return
            }


            html.push(`

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
                        px-2
                        text-sm
                        font-semibold
                        ${
                            page === current
                                ? 'bg-sky-500 text-white'
                                : 'border border-slate-200 text-slate-600 hover:bg-sky-50'
                        }
                    "
                >
                    ${page}
                </button>

            `)
        }
    )


    html.push(`

        <button
            type="button"
            ${
                current >= lastPage
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
                    current >= lastPage
                        ? 'cursor-not-allowed text-slate-300'
                        : 'text-slate-600 hover:bg-sky-50'
                }
            "
        >
            <i
                class="
                    fa-solid
                    fa-chevron-right
                    text-xs
                "
            ></i>
        </button>

    `)


    container.innerHTML =
        html.join('')
}


function buildPaginationPages(
    current,
    last
) {

    if (
        last <= 7
    ) {

        return Array.from(
            {
                length:
                    last,
            },
            (
                _,
                index
            ) =>
                index + 1
        )
    }


    const pages =
        [
            1,
        ]


    if (
        current > 4
    ) {

        pages.push(
            '...'
        )
    }


    const start =
        Math.max(
            2,
            current - 1
        )


    const end =
        Math.min(
            last - 1,
            current + 1
        )


    for (
        let page = start;
        page <= end;
        page++
    ) {

        pages.push(
            page
        )
    }


    if (
        current <
        last - 3
    ) {

        pages.push(
            '...'
        )
    }


    pages.push(
        last
    )


    return pages
}


async function goToPage(
    page
) {

    if (
        page < 1
    ) {
        return
    }


    const lastPage =
        Number(
            currentMeta?.lastPage ||
            currentMeta?.last_page ||
            1
        )


    if (
        page >
        lastPage
    ) {
        return
    }


    await loadSubjects(
        page
    )
}


/*
|--------------------------------------------------------------------------
| CREATE
|--------------------------------------------------------------------------
*/

function openCreateModal() {

    editingSubjectId =
        null


    const modal =
        document.getElementById(
            'subjectModal'
        )

    const content =
        document.getElementById(
            'subjectModalContent'
        )

    const form =
        document.getElementById(
            'subjectForm'
        )


    if (!modal) {

        console.error(
            '#subjectModal introuvable.'
        )

        return
    }


    form?.reset()


    setText(
        'subjectModalTitle',
        'Nouvelle matière'
    )

    setText(
        'subjectModalSubtitle',
        'Ajoutez une nouvelle discipline à votre établissement.'
    )

    setText(
        'subjectSubmitText',
        'Enregistrer la matière'
    )


    const status =
        document.getElementById(
            'subjectStatus'
        )

    if (status) {

        status.value =
            'ACTIVE'
    }


    hideSubjectFormError()


    modal.classList.remove(
        'hidden'
    )

    modal.classList.add(
        'flex'
    )


    requestAnimationFrame(
        () => {

            modal.classList.remove(
                'opacity-0'
            )

            content?.classList.remove(
                'scale-95'
            )

            content?.classList.add(
                'scale-100'
            )
        }
    )


    document
        .getElementById(
            'subjectName'
        )
        ?.focus()


    window.openCreateModal =
        openCreateModal
}


window.openCreateModal =
    openCreateModal


/*
|--------------------------------------------------------------------------
| CLOSE CREATE / EDIT
|--------------------------------------------------------------------------
*/

function closeSubjectModal() {

    const modal =
        document.getElementById(
            'subjectModal'
        )

    const content =
        document.getElementById(
            'subjectModalContent'
        )


    if (!modal) {
        return
    }


    modal.classList.add(
        'opacity-0'
    )


    content?.classList.remove(
        'scale-100'
    )

    content?.classList.add(
        'scale-95'
    )


    window.setTimeout(
        () => {

            modal.classList.remove(
                'flex'
            )

            modal.classList.add(
                'hidden'
            )

        },
        200
    )
}


window.closeSubjectModal =
    closeSubjectModal


/*
|--------------------------------------------------------------------------
| FORM ERROR
|--------------------------------------------------------------------------
*/

function showSubjectFormError(
    message
) {

    const element =
        document.getElementById(
            'subjectFormError'
        )

    if (!element) {
        return
    }


    element.textContent =
        message


    element.classList.remove(
        'hidden'
    )
}


function hideSubjectFormError() {

    document
        .getElementById(
            'subjectFormError'
        )
        ?.classList.add(
            'hidden'
        )
}


/*
|--------------------------------------------------------------------------
| SAVE
|--------------------------------------------------------------------------
*/

async function saveSubject(
    event
) {

    event.preventDefault()


    hideSubjectFormError()


    const name =
        document
            .getElementById(
                'subjectName'
            )
            ?.value
            ?.trim() ||
        ''


    const description =
        document
            .getElementById(
                'subjectDescription'
            )
            ?.value
            ?.trim() ||
        ''


    const statut =
        normalizeStatus(
            document
                .getElementById(
                    'subjectStatus'
                )
                ?.value ||
            'ACTIVE'
        )


    if (!name) {

        showSubjectFormError(
            'Le nom de la matière est obligatoire.'
        )

        return
    }


    if (
        name.length > 100
    ) {

        showSubjectFormError(
            'Le nom de la matière ne peut pas dépasser 100 caractères.'
        )

        return
    }


    const isEdit =
        Boolean(
            editingSubjectId
        )


    const button =
        document.getElementById(
            'subjectSubmitButton'
        )


    const submitText =
        document.getElementById(
            'subjectSubmitText'
        )


    if (button) {

        button.disabled =
            true
    }


    setText(
        'subjectSubmitText',
        'Enregistrement…'
    )


    const payload =
        {
            nom:
                name,

            description:
                description ||
                null,

            statut:
                statut === 'INACTIVE'
                    ? 'INACTIVE'
                    : 'ACTIVE',
        }


    try {

        const url =
            isEdit
                ? `/api/school-admin/matieres/${editingSubjectId}`
                : '/api/school-admin/matieres'


        const response =
            await apiRequest(
                url,
                {
                    method:
                        isEdit
                            ? 'PUT'
                            : 'POST',

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


        const result =
            await parseResponse(
                response
            )


        if (
            !response.ok ||
            !result?.success
        ) {

            throw new Error(
                result?.message ||
                'Impossible d’enregistrer la matière.'
            )
        }


        closeSubjectModal()


        await Promise.all(
            [
                loadStatistics(),
                loadSubjects(
                    currentPage
                ),
            ]
        )


        showToast(
            isEdit
                ? 'Matière modifiée'
                : 'Matière créée',
            isEdit
                ? 'La matière a été modifiée avec succès.'
                : 'La matière a été ajoutée avec succès.',
            'success'
        )

    } catch (error) {

        console.error(
            'saveSubject:',
            error
        )

        showSubjectFormError(
            error.message
        )

    } finally {

        if (button) {

            button.disabled =
                false
        }

        setText(
            'subjectSubmitText',
            isEdit
                ? 'Enregistrer les modifications'
                : 'Enregistrer la matière'
        )
    }
}


/*
|--------------------------------------------------------------------------
| EDIT
|--------------------------------------------------------------------------
*/

async function editSubject(
    id
) {

    try {

        const response =
            await apiRequest(
                `/api/school-admin/matieres/${id}`
            )


        const result =
            await parseResponse(
                response
            )


        if (
            !response.ok ||
            !result?.success
        ) {

            throw new Error(
                result?.message ||
                'Impossible de récupérer la matière.'
            )
        }


        const subject =
            result.data


        editingSubjectId =
            Number(
                subject.id
            )


        document
            .getElementById(
                'subjectName'
            )
            .value =
            subject.nom ||
            ''


        document
            .getElementById(
                'subjectDescription'
            )
            .value =
            subject.description ||
            ''


        document
            .getElementById(
                'subjectStatus'
            )
            .value =
            normalizeStatus(
                subject.statut
            ) === 'INACTIVE'
                ? 'INACTIVE'
                : 'ACTIVE'


        setText(
            'subjectModalTitle',
            'Modifier la matière'
        )

        setText(
            'subjectModalSubtitle',
            'Modifiez les informations de cette discipline.'
        )

        setText(
            'subjectSubmitText',
            'Enregistrer les modifications'
        )


        hideSubjectFormError()


        const modal =
            document.getElementById(
                'subjectModal'
            )

        const content =
            document.getElementById(
                'subjectModalContent'
            )


        modal.classList.remove(
            'hidden'
        )

        modal.classList.add(
            'flex'
        )


        requestAnimationFrame(
            () => {

                modal.classList.remove(
                    'opacity-0'
                )

                content?.classList.remove(
                    'scale-95'
                )

                content?.classList.add(
                    'scale-100'
                )
            }
        )


        document
            .getElementById(
                'subjectName'
            )
            ?.focus()

    } catch (error) {

        console.error(
            'editSubject:',
            error
        )

        showToast(
            'Erreur',
            error.message,
            'error'
        )
    }
}


/*
|--------------------------------------------------------------------------
| DETAIL
|--------------------------------------------------------------------------
*/

async function viewSubject(
    id
) {

    try {

        const response =
            await apiRequest(
                `/api/school-admin/matieres/${id}`
            )


        const result =
            await parseResponse(
                response
            )


        if (
            !response.ok ||
            !result?.success
        ) {

            throw new Error(
                result?.message ||
                'Impossible de récupérer les détails.'
            )
        }


        const subject =
            result.data


        setText(
            'detailSubjectTitle',
            subject.nom ||
            'Matière'
        )


        setText(
            'detailDescription',
            subject.description ||
            'Aucune description.'
        )


        setText(
            'detailDevoirs',
            formatNumber(
                subject.devoirsCount ||
                0
            )
        )


        setText(
            'detailExercices',
            formatNumber(
                subject.exercicesCount ||
                0
            )
        )


        const statusElement =
            document.getElementById(
                'detailStatus'
            )


        if (
            statusElement
        ) {

            const status =
                normalizeStatus(
                    subject.statut
                )


            statusElement.innerHTML =
                status === 'ACTIVE'
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
                                text-emerald-600
                            "
                        >

                            <span
                                class="
                                    h-2
                                    w-2
                                    rounded-full
                                    bg-emerald-500
                                "
                            ></span>

                            Matière active

                        </span>
                    `
                    : `
                        <span
                            class="
                                inline-flex
                                items-center
                                gap-2
                                rounded-full
                                bg-slate-100
                                px-3
                                py-1.5
                                text-xs
                                font-semibold
                                text-slate-500
                            "
                        >

                            <span
                                class="
                                    h-2
                                    w-2
                                    rounded-full
                                    bg-slate-400
                                "
                            ></span>

                            Matière inactive

                        </span>
                    `
        }


        const modal =
            document.getElementById(
                'detailModal'
            )

        const content =
            document.getElementById(
                'detailModalContent'
            )


        modal.classList.remove(
            'hidden'
        )

        modal.classList.add(
            'flex'
        )


        requestAnimationFrame(
            () => {

                modal.classList.remove(
                    'opacity-0'
                )

                content?.classList.remove(
                    'scale-95'
                )

                content?.classList.add(
                    'scale-100'
                )
            }
        )

    } catch (error) {

        console.error(
            'viewSubject:',
            error
        )

        showToast(
            'Erreur',
            error.message,
            'error'
        )
    }
}


function closeDetailModal() {

    const modal =
        document.getElementById(
            'detailModal'
        )

    const content =
        document.getElementById(
            'detailModalContent'
        )


    if (!modal) {
        return
    }


    modal.classList.add(
        'opacity-0'
    )


    content?.classList.remove(
        'scale-100'
    )

    content?.classList.add(
        'scale-95'
    )


    setTimeout(
        () => {

            modal.classList.remove(
                'flex'
            )

            modal.classList.add(
                'hidden'
            )

        },
        200
    )
}


window.viewSubject =
    viewSubject

window.closeDetailModal =
    closeDetailModal


/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

async function changeSubjectStatus(
    id
) {

    const subject =
        currentSubjects.find(
            item =>
                Number(
                    item.id
                ) === Number(
                    id
                )
        )


    if (!subject) {

        showToast(
            'Erreur',
            'Cette matière est introuvable.',
            'error'
        )

        return
    }


    const currentStatus =
        normalizeStatus(
            subject.statut
        )


    const newStatus =
        currentStatus === 'ACTIVE'
            ? 'INACTIVE'
            : 'ACTIVE'


    const actionLabel =
        newStatus === 'ACTIVE'
            ? 'activer'
            : 'désactiver'


    openConfirmModal(
        {
            title:
                newStatus === 'ACTIVE'
                    ? 'Activer la matière'
                    : 'Désactiver la matière',

            message:
                `Voulez-vous vraiment ${actionLabel} « ${subject.nom} » ?`,

            buttonText:
                newStatus === 'ACTIVE'
                    ? 'Activer'
                    : 'Désactiver',

            type:
                newStatus === 'ACTIVE'
                    ? 'success'
                    : 'warning',

            callback:
                async () => {

                    const response =
                        await apiRequest(
                            `/api/school-admin/matieres/${id}/statut`,
                            {
                                method:
                                    'PATCH',

                                headers: {
                                    'Content-Type':
                                        'application/json',
                                },

                                body:
                                    JSON.stringify(
                                        {
                                            statut:
                                                newStatus,
                                        }
                                    ),
                            }
                        )


                    const result =
                        await parseResponse(
                            response
                        )


                    if (
                        !response.ok ||
                        !result?.success
                    ) {

                        throw new Error(
                            result?.message ||
                            'Impossible de modifier le statut.'
                        )
                    }


                    await Promise.all(
                        [
                            loadStatistics(),
                            loadSubjects(
                                currentPage
                            ),
                        ]
                    )


                    showToast(
                        'Statut modifié',
                        newStatus === 'ACTIVE'
                            ? 'La matière est maintenant active.'
                            : 'La matière a été désactivée.',
                        'success'
                    )
                },
        }
    )
}


/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
*/

async function deleteSubject(
    id
) {

    const subject =
        currentSubjects.find(
            item =>
                Number(
                    item.id
                ) === Number(
                    id
                )
        )


    if (!subject) {

        showToast(
            'Erreur',
            'Cette matière est introuvable.',
            'error'
        )

        return
    }


    subjectToDelete =
        Number(
            id
        )


    openConfirmModal(
        {
            title:
                'Supprimer la matière',

            message:
                `Vous êtes sur le point de supprimer « ${subject.nom} ». Cette opération est définitive.`,

            buttonText:
                'Supprimer',

            type:
                'danger',

            callback:
                async () => {

                    const response =
                        await apiRequest(
                            `/api/school-admin/matieres/${subjectToDelete}`,
                            {
                                method:
                                    'DELETE',
                            }
                        )


                    const result =
                        await parseResponse(
                            response
                        )


                    if (
                        !response.ok ||
                        !result?.success
                    ) {

                        throw new Error(
                            result?.message ||
                            'Impossible de supprimer la matière.'
                        )
                    }


                    await Promise.all(
                        [
                            loadStatistics(),
                            loadSubjects(
                                currentPage
                            ),
                        ]
                    )


                    showToast(
                        'Matière supprimée',
                        'La matière a été supprimée avec succès.',
                        'success'
                    )


                    subjectToDelete =
                        null
                },
        }
    )
}


/*
|--------------------------------------------------------------------------
| CONFIRM MODAL
|--------------------------------------------------------------------------
*/

function openConfirmModal(
    options
) {

    const modal =
        document.getElementById(
            'confirmModal'
        )

    const content =
        document.getElementById(
            'confirmModalContent'
        )

    if (!modal) {
        return
    }


    setText(
        'confirmTitle',
        options.title ||
        'Confirmation'
    )


    setText(
        'confirmMessage',
        options.message ||
        'Êtes-vous sûr de vouloir continuer ?'
    )


    setText(
        'confirmActionButton',
        options.buttonText ||
        'Confirmer'
    )


    const button =
        document.getElementById(
            'confirmActionButton'
        )


    const icon =
        document.getElementById(
            'confirmIcon'
        )


    if (
        options.type ===
        'danger'
    ) {

        button?.classList.remove(
            'bg-sky-500',
            'hover:bg-sky-600',
            'bg-emerald-500',
            'hover:bg-emerald-600'
        )

        button?.classList.add(
            'bg-red-500',
            'hover:bg-red-600'
        )


        icon?.classList.remove(
            'bg-emerald-50',
            'text-emerald-600',
            'bg-amber-50',
            'text-amber-600'
        )

        icon?.classList.add(
            'bg-red-50',
            'text-red-500'
        )

        if (icon) {

            icon.innerHTML =
                `
                    <i
                        class="
                            fa-solid
                            fa-trash
                        "
                    ></i>
                `
        }

    } else if (
        options.type ===
        'success'
    ) {

        button?.classList.remove(
            'bg-red-500',
            'hover:bg-red-600'
        )

        button?.classList.add(
            'bg-emerald-500',
            'hover:bg-emerald-600'
        )


        icon?.classList.remove(
            'bg-red-50',
            'text-red-500',
            'bg-amber-50',
            'text-amber-600'
        )

        icon?.classList.add(
            'bg-emerald-50',
            'text-emerald-600'
        )

        if (icon) {

            icon.innerHTML =
                `
                    <i
                        class="
                            fa-solid
                            fa-check
                        "
                    ></i>
                `
        }

    } else {

        button?.classList.remove(
            'bg-red-500',
            'hover:bg-red-600',
            'bg-emerald-500',
            'hover:bg-emerald-600'
        )

        button?.classList.add(
            'bg-amber-500',
            'hover:bg-amber-600'
        )


        icon?.classList.remove(
            'bg-red-50',
            'text-red-500',
            'bg-emerald-50',
            'text-emerald-600'
        )

        icon?.classList.add(
            'bg-amber-50',
            'text-amber-600'
        )

        if (icon) {

            icon.innerHTML =
                `
                    <i
                        class="
                            fa-solid
                            fa-triangle-exclamation
                        "
                    ></i>
                `
        }
    }


    confirmCallback =
        options.callback ||
        null


    modal.classList.remove(
        'hidden'
    )

    modal.classList.add(
        'flex'
    )


    requestAnimationFrame(
        () => {

            modal.classList.remove(
                'opacity-0'
            )

            content?.classList.remove(
                'scale-95'
            )

            content?.classList.add(
                'scale-100'
            )
        }
    )
}


function closeConfirmModal() {

    const modal =
        document.getElementById(
            'confirmModal'
        )

    const content =
        document.getElementById(
            'confirmModalContent'
        )


    if (!modal) {
        return
    }


    modal.classList.add(
        'opacity-0'
    )


    content?.classList.remove(
        'scale-100'
    )

    content?.classList.add(
        'scale-95'
    )


    setTimeout(
        () => {

            modal.classList.remove(
                'flex'
            )

            modal.classList.add(
                'hidden'
            )

            confirmCallback =
                null

        },
        200
    )
}


async function executeConfirmAction() {

    const button =
        document.getElementById(
            'confirmActionButton'
        )


    if (
        typeof confirmCallback !==
        'function'
    ) {

        closeConfirmModal()

        return
    }


    if (button) {

        button.disabled =
            true

        button.innerHTML =
            `
                <i
                    class="
                        fa-solid
                        fa-spinner
                        fa-spin
                        mr-2
                    "
                ></i>

                Traitement…
            `
    }


    try {

        await confirmCallback()

        closeConfirmModal()

    } catch (error) {

        console.error(
            'confirm action:',
            error
        )

        showToast(
            'Opération impossible',
            error.message,
            'error'
        )

        closeConfirmModal()

    } finally {

        if (button) {

            button.disabled =
                false

            button.textContent =
                'Confirmer'
        }
    }
}


/*
|--------------------------------------------------------------------------
| TOAST
|--------------------------------------------------------------------------
*/

function showToast(
    title,
    message,
    type = 'success'
) {

    const toast =
        document.getElementById(
            'toast'
        )

    const icon =
        document.getElementById(
            'toastIcon'
        )

    const iconElement =
        document.getElementById(
            'toastIconElement'
        )


    setText(
        'toastTitle',
        title
    )

    setText(
        'toastMessage',
        message
    )


    if (
        type ===
        'error'
    ) {

        icon?.classList.remove(
            'bg-emerald-50',
            'text-emerald-600'
        )

        icon?.classList.add(
            'bg-red-50',
            'text-red-600'
        )


        if (iconElement) {

            iconElement.className =
                'fa-solid fa-circle-exclamation'
        }

    } else {

        icon?.classList.remove(
            'bg-red-50',
            'text-red-600'
        )

        icon?.classList.add(
            'bg-emerald-50',
            'text-emerald-600'
        )


        if (iconElement) {

            iconElement.className =
                'fa-solid fa-check'
        }
    }


    toast?.classList.remove(
        'hidden'
    )


    requestAnimationFrame(
        () => {

            toast?.classList.remove(
                'translate-y-3',
                'opacity-0'
            )

            toast?.classList.add(
                'translate-y-0',
                'opacity-100'
            )
        }
    )


    clearTimeout(
        toastTimer
    )


    toastTimer =
        setTimeout(
            () => {

                toast?.classList.add(
                    'translate-y-3',
                    'opacity-0'
                )

                toast?.classList.remove(
                    'translate-y-0',
                    'opacity-100'
                )


                setTimeout(
                    () => {

                        toast?.classList.add(
                            'hidden'
                        )

                    },
                    250
                )

            },
            4000
        )
}


/*
|--------------------------------------------------------------------------
| MOBILE MENU
|--------------------------------------------------------------------------
*/

function setupMobileMenu() {

    const sidebar =
        document.getElementById(
            'sidebar'
        )

    const overlay =
        document.getElementById(
            'sidebarOverlay'
        )

    const openButton =
        document.getElementById(
            'openSidebar'
        )

    const closeButton =
        document.getElementById(
            'closeSidebar'
        )


    function openMenu() {

        sidebar?.classList.remove(
            '-translate-x-full'
        )

        overlay?.classList.remove(
            'hidden'
        )

        document.body.classList.add(
            'overflow-hidden'
        )
    }


    function closeMenu() {

        sidebar?.classList.add(
            '-translate-x-full'
        )

        overlay?.classList.add(
            'hidden'
        )

        document.body.classList.remove(
            'overflow-hidden'
        )
    }


    openButton?.addEventListener(
        'click',
        openMenu
    )


    closeButton?.addEventListener(
        'click',
        closeMenu
    )


    overlay?.addEventListener(
        'click',
        closeMenu
    )


    window.addEventListener(
        'resize',
        () => {

            if (
                window.innerWidth >=
                1024
            ) {
                closeMenu()
            }
        }
    )
}


/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

async function logout() {

    const confirmed =
        window.confirm(
            'Voulez-vous vraiment vous déconnecter ?'
        )


    if (!confirmed) {
        return
    }


    const token =
        getToken()


    try {

        if (token) {

            await fetch(
                '/api/auth/logout',
                {
                    method:
                        'POST',

                    headers: {
                        Accept:
                            'application/json',

                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            )
        }

    } catch (error) {

        console.error(
            'logout:',
            error
        )

    } finally {

        sessionStorage.clear()

        window.location.replace('/')
    }
}


/*
|--------------------------------------------------------------------------
| FILTERS
|--------------------------------------------------------------------------
*/

function setupFilters() {

    const searchInput =
        document.getElementById(
            'searchInput'
        )

    const statusFilter =
        document.getElementById(
            'statusFilter'
        )


    searchInput?.addEventListener(
        'input',
        () => {

            clearTimeout(
                searchTimer
            )


            searchTimer =
                setTimeout(
                    () => {

                        loadSubjects(
                            1
                        )

                    },
                    350
                )
        }
    )


    statusFilter?.addEventListener(
        'change',
        () => {

            loadSubjects(
                1
            )
        }
    )
}


/*
|--------------------------------------------------------------------------
| OVERLAY CLOSURE
|--------------------------------------------------------------------------
*/

function setupOverlayClosures() {

    document
        .getElementById(
            'subjectModal'
        )
        ?.addEventListener(
            'click',
            event => {

                if (
                    event.target.id ===
                    'subjectModal'
                ) {

                    closeSubjectModal()
                }
            }
        )


    document
        .getElementById(
            'detailModal'
        )
        ?.addEventListener(
            'click',
            event => {

                if (
                    event.target.id ===
                    'detailModal'
                ) {

                    closeDetailModal()
                }
            }
        )


    document
        .getElementById(
            'confirmModal'
        )
        ?.addEventListener(
            'click',
            event => {

                if (
                    event.target.id ===
                    'confirmModal'
                ) {

                    closeConfirmModal()
                }
            }
        )
}


/*
|--------------------------------------------------------------------------
| INITIALISATION
|--------------------------------------------------------------------------
*/

document.addEventListener(
    'DOMContentLoaded',
    async () => {


        setupMobileMenu()

        setupFilters()

        setupOverlayClosures()


        document
            .getElementById(
                'logoutButton'
            )
            ?.addEventListener(
                'click',
                logout
            )


        document
            .getElementById(
                'subjectForm'
            )
            ?.addEventListener(
                'submit',
                saveSubject
            )


        document
            .getElementById(
                'confirmActionButton'
            )
            ?.addEventListener(
                'click',
                executeConfirmAction
            )


        try {

            /*
             * 1. UTILISATEUR
             * 2. ÉCOLE ACTIVE
             * 3. STATISTIQUES
             * 4. MATIÈRES
             */

            await loadCurrentUser()

            await Promise.all(
                [
                    loadStatistics(),
                    loadSubjects(
                        1
                    ),
                ]
            )

        } catch (error) {

            console.error(
                'Initialisation page Matières:',
                error
            )


            showPageError(
                error.message
            )
        }

    }
)


/*
|--------------------------------------------------------------------------
| ESCAPE
|--------------------------------------------------------------------------
*/

document.addEventListener(
    'keydown',
    event => {

        if (
            event.key !==
            'Escape'
        ) {
            return
        }


        closeSubjectModal()

        closeDetailModal()

        closeConfirmModal()
    }
)


/*
|--------------------------------------------------------------------------
| EXPORTS GLOBAUX
|--------------------------------------------------------------------------
*/

window.openCreateModal =
    openCreateModal

window.closeSubjectModal =
    closeSubjectModal

window.viewSubject =
    viewSubject

window.closeDetailModal =
    closeDetailModal

window.editSubject =
    editSubject

window.changeSubjectStatus =
    changeSubjectStatus

window.deleteSubject =
    deleteSubject

window.closeConfirmModal =
    closeConfirmModal

window.goToPage =
    goToPage

window.loadSubjects =
    loadSubjects

window.loadStatistics =
    loadStatistics

window.logout =
    logout