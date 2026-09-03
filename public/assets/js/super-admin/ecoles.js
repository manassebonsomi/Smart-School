

    const TOKEN_KEY =
        'smart_school_access_token'


    const USER_KEY =
        'smart_school_user'


    let currentPage =
        1


    let currentMeta = null


    let currentSchools = []


    let confirmCallback =
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


    function formatNumber(
        value
    ) {

        return new Intl.NumberFormat(
            'fr-FR'
        ).format(
            Number(value || 0)
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
        ).format(date)

    }


    function escapeHtml(
        value
    ) {

        const div =
            document.createElement(
                'div'
            )


        div.textContent =
            value ?? ''


        return div.innerHTML

    }


    function showPageError(
        message
    ) {

        const element =
            document.getElementById(
                'pageError'
            )


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


    function showSuccess(
        message
    ) {

        const element =
            document.getElementById(
                'pageSuccess'
            )


        element.textContent =
            message


        element.classList.remove(
            'hidden'
        )


        setTimeout(() => {

            element.classList.add(
                'hidden'
            )

        }, 4000)

    }


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

                        ...(options.headers || {}),

                        Authorization:
                            `Bearer ${token}`,

                        Accept:
                            'application/json',

                    },

                }
            )


        if (
            response.status === 401
        ) {

            sessionStorage.clear()

            window.location.replace('/')

            throw new Error(
                'Session expirée.'
            )

        }


        if (
            response.status === 403
        ) {

            throw new Error(
                'Accès refusé. Cette opération est réservée au Super Administrateur.'
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
    | USER
    |--------------------------------------------------------------------------
    */

    function loadCurrentUser() {

        const raw =
            sessionStorage.getItem(
                USER_KEY
            )


        if (!raw) {
            return null
        }


        try {

            return JSON.parse(
                raw
            )

        } catch {

            return null

        }

    }


    function renderCurrentUser() {

        const user =
            loadCurrentUser()


        if (!user) {
            return
        }


        const initials =
            (
                `${user.prenom || ''}${user.nom || ''}`
            )
                .trim()
                .slice(0, 2)
                .toUpperCase()
                || 'SA'


        const fullName =
            `${user.prenom || ''} ${user.nom || ''}`
                .trim()
                || 'Super Administrateur'


        document
            .getElementById(
                'headerAvatar'
            )
            .textContent =
            initials


        document
            .getElementById(
                'sidebarAvatar'
            )
            .textContent =
            initials


        document
            .getElementById(
                'headerUserName'
            )
            .textContent =
            fullName


        document
            .getElementById(
                'sidebarUserName'
            )
            .textContent =
            fullName


        document
            .getElementById(
                'sidebarUserEmail'
            )
            .textContent =
            user.email || ''

    }


    /*
    |--------------------------------------------------------------------------
    | SUMMARY
    |--------------------------------------------------------------------------
    */

    async function loadSummary() {

        const response =
            await apiRequest(
                '/api/super-admin/ecoles?limit=1'
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
                'Impossible de charger les statistiques des écoles.'
            )

        }


        const meta =
            result.data?.meta


        document
            .getElementById(
                'totalSchools'
            )
            .textContent =
            formatNumber(
                meta?.total ?? 0
            )


        const [
            activeResult,
            suspendedResult,
        ] =
            await Promise.all([

                apiRequest(
                    '/api/super-admin/ecoles?limit=1&statut=ACTIF'
                ),

                apiRequest(
                    '/api/super-admin/ecoles?limit=1&statut=SUSPENDU'
                ),

            ])


        const activeData =
            await parseResponse(
                activeResult
            )


        const suspendedData =
            await parseResponse(
                suspendedResult
            )


        const active =
            Number(
                activeData?.data?.meta?.total || 0
            )


        const suspended =
            Number(
                suspendedData?.data?.meta?.total || 0
            )


        document
            .getElementById(
                'activeSchools'
            )
            .textContent =
            formatNumber(
                active
            )


        document
            .getElementById(
                'suspendedSchools'
            )
            .textContent =
            formatNumber(
                suspended
            )


        const total =
            Number(
                meta?.total || 0
            )


        const percent =
            total > 0
                ? Math.round(
                    (
                        active /
                        total
                    ) * 100
                )
                : 0


        document
            .getElementById(
                'activeSchoolsPercent'
            )
            .textContent =
            `${percent}% du total`


        /**
         * Le nombre d'élèves sera déterminé à partir
         * des écoles. Pour ne pas charger toute la base
         * avec de multiples requêtes, nous récupérons
         * jusqu'à 100 écoles ici.
         */
        const allSchoolsResponse =
            await apiRequest(
                '/api/super-admin/ecoles?limit=100'
            )


        const allSchools =
            await parseResponse(
                allSchoolsResponse
            )


        const schools =
            allSchools?.data?.data || []


        const students =
            schools.reduce(
                (
                    totalStudents,
                    school
                ) =>
                    totalStudents +
                    Number(
                        school.nombreEleves || 0
                    ),
                0
            )


        document
            .getElementById(
                'totalStudents'
            )
            .textContent =
            formatNumber(
                students
            )

    }


    /*
    |--------------------------------------------------------------------------
    | LISTE
    |--------------------------------------------------------------------------
    */

    async function loadSchools(
        page = 1
    ) {

        hidePageError()


        const search =
            document
                .getElementById(
                    'searchInput'
                )
                .value
                .trim()


        const statut =
            document
                .getElementById(
                    'statusFilter'
                )
                .value


        const province =
            document
                .getElementById(
                    'provinceFilter'
                )
                .value


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


        if (province) {

            params.set(
                'province',
                province
            )

        }


        const response =
            await apiRequest(
                `/api/super-admin/ecoles?${params.toString()}`
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
                'Impossible de charger la liste des écoles.'
            )

        }


        currentPage =
            page


        currentMeta =
            result.data?.meta || null


        currentSchools =
            result.data?.data || []


        renderSchools(
            currentSchools
        )


        renderPagination(
            currentMeta
        )


        document
            .getElementById(
                'resultCount'
            )
            .textContent =
            `${formatNumber(
                currentMeta?.total || 0
            )} ${
                Number(currentMeta?.total || 0) > 1
                    ? 'écoles'
                    : 'école'
            }`

    }


    /*
    |--------------------------------------------------------------------------
    | TABLE
    |--------------------------------------------------------------------------
    */

    function renderSchools(
        schools
    ) {

        const table =
            document.getElementById(
                'schoolsTable'
            )


        const emptyState =
            document.getElementById(
                'emptyState'
            )


        if (!schools.length) {

            table.innerHTML =
                ''


            emptyState.classList.remove(
                'hidden'
            )


            return

        }


        emptyState.classList.add(
            'hidden'
        )


        table.innerHTML =
            schools
                .map(
                    school => {

                        const status =
                            getStatusPresentation(
                                school.statut
                            )


                        return `

                            <tr class="hover:bg-slate-50 transition">

                                <td class="px-6 py-4">

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
                                                bg-sky-50
                                                text-sky-600
                                            "
                                        >

                                            <i class="fa-solid fa-school"></i>

                                        </div>


                                        <div>

                                            <p class="text-sm font-semibold text-slate-700">
                                                ${escapeHtml(school.nom || '—')}
                                            </p>

                                            <p class="mt-1 text-xs text-slate-400">
                                                ${escapeHtml(school.code || '')}
                                            </p>

                                        </div>

                                    </div>

                                </td>


                                <td class="px-6 py-4">

                                    <p class="text-sm text-slate-600">
                                        ${escapeHtml(school.ville || '—')}
                                    </p>

                                    <p class="mt-1 text-xs text-slate-400">
                                        ${escapeHtml(school.province || school.commune || '')}
                                    </p>

                                </td>


                                <td class="px-6 py-4">

                                    <span class="text-sm font-semibold text-slate-700">
                                        ${formatNumber(school.nombreEleves)}
                                    </span>

                                </td>


                                <td class="px-6 py-4">

                                    <span class="text-sm font-semibold text-slate-700">
                                        ${formatNumber(school.nombreAdministrateurs)}
                                    </span>

                                </td>


                                <td class="px-6 py-4 text-sm text-slate-500">
                                    ${formatDate(school.createdAt)}
                                </td>


                                <td class="px-6 py-4">

                                    <span
                                        class="
                                            inline-flex
                                            items-center
                                            gap-1.5
                                            rounded-full
                                            px-2.5
                                            py-1
                                            text-xs
                                            font-semibold
                                            ${status.className}
                                        "
                                    >

                                        <span
                                            class="
                                                h-1.5
                                                w-1.5
                                                rounded-full
                                                ${status.dotClass}
                                            "
                                        ></span>

                                        ${status.label}

                                    </span>

                                </td>


                                <td class="px-6 py-4">

                                    <div class="flex justify-end gap-2">

                                        <button
                                            type="button"
                                            class="action-btn text-sky-600 hover:bg-sky-50"
                                            title="Détails"
                                            onclick="viewSchool(${school.id})"
                                        >
                                            <i class="fa-regular fa-eye"></i>
                                        </button>


                                        <button
                                            type="button"
                                            class="action-btn text-indigo-600 hover:bg-indigo-50"
                                            title="Modifier"
                                            onclick="editSchool(${school.id})"
                                        >
                                            <i class="fa-solid fa-pen"></i>
                                        </button>


                                        ${
                                            school.statut === 'ACTIF'
                                                ? `
                                                    <button
                                                        type="button"
                                                        class="action-btn text-amber-600 hover:bg-amber-50"
                                                        title="Suspendre"
                                                        onclick="suspendSchool(${school.id})"
                                                    >
                                                        <i class="fa-solid fa-ban"></i>
                                                    </button>
                                                `
                                                : school.statut === 'SUSPENDU'
                                                    ? `
                                                        <button
                                                            type="button"
                                                            class="action-btn text-emerald-600 hover:bg-emerald-50"
                                                            title="Réactiver"
                                                            onclick="activateSchool(${school.id})"
                                                        >
                                                            <i class="fa-solid fa-check"></i>
                                                        </button>
                                                    `
                                                    : ''
                                        }


                                        ${
                                            school.statut !== 'ARCHIVE'
                                                ? `
                                                    <button
                                                        type="button"
                                                        class="action-btn text-red-600 hover:bg-red-50"
                                                        title="Supprimer"
                                                        onclick="deleteSchool(${school.id})"
                                                    >
                                                        <i class="fa-regular fa-trash-can"></i>
                                                    </button>
                                                `
                                                : ''
                                        }

                                    </div>

                                </td>

                            </tr>

                        `

                    }
                )
                .join('')

    }


    function getStatusPresentation(
    statut
) {

    switch (
        String(statut || '').toUpperCase()
    ) {

        case 'ACTIF':

            return {

                label: 'Active',

                className:
                    'bg-emerald-50 text-emerald-600',

                textClass:
                    'text-emerald-600',

                dotClass:
                    'bg-emerald-500',

            }


        case 'SUSPENDU':

            return {

                label: 'Suspendue',

                className:
                    'bg-amber-50 text-amber-600',

                textClass:
                    'text-amber-600',

                dotClass:
                    'bg-amber-500',

            }


        case 'ARCHIVE':

            return {

                label: 'Archivée',

                className:
                    'bg-slate-100 text-slate-600',

                textClass:
                    'text-slate-600',

                dotClass:
                    'bg-slate-400',

            }


        default:

            return {

                label:
                    statut || 'Inconnu',

                className:
                    'bg-slate-100 text-slate-600',

                textClass:
                    'text-slate-600',

                dotClass:
                    'bg-slate-400',

            }

    }

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


        const info =
            document.getElementById(
                'paginationInfo'
            )


        if (!meta) {

            container.innerHTML =
                ''

            info.textContent =
                'Aucun résultat'

            return

        }


        const current =
            Number(
                meta.currentPage ||
                currentPage
            )


        const last =
            Number(
                meta.lastPage ||
                1
            )


        const total =
            Number(
                meta.total ||
                0
            )


        const perPage =
            Number(
                meta.perPage ||
                10
            )


        const from =
            total === 0
                ? 0
                : (
                    (
                        current - 1
                    ) *
                    perPage
                ) + 1


        const to =
            Math.min(
                current * perPage,
                total
            )


        info.innerHTML = `
            Affichage de
            <span class="font-semibold text-slate-600">
                ${formatNumber(from)}
            </span>
            à
            <span class="font-semibold text-slate-600">
                ${formatNumber(to)}
            </span>
            sur
            <span class="font-semibold text-slate-600">
                ${formatNumber(total)}
            </span>
            écoles
        `


        if (
            last <= 1
        ) {

            container.innerHTML =
                ''

            return

        }


        const buttons = []


        buttons.push(`
            <button
                type="button"
                ${current <= 1 ? 'disabled' : ''}
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
                <i class="fa-solid fa-chevron-left text-xs"></i>
            </button>
        `)


        const pages =
            buildPaginationPages(
                current,
                last
            )


        pages.forEach(
            page => {

                if (
                    page === '...'
                ) {

                    buttons.push(`
                        <span class="px-1 text-slate-400">
                            ...
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


        buttons.push(`
            <button
                type="button"
                ${current >= last ? 'disabled' : ''}
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
                            : 'text-slate-600 hover:bg-sky-50'
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

        if (
            last <= 7
        ) {

            return Array.from(
                {
                    length: last,
                },
                (
                    _,
                    index
                ) =>
                    index + 1
            )

        }


        const pages = [

            1,

        ]


        if (
            current > 4
        ) {

            pages.push('...')

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
            current < last - 3
        ) {

            pages.push('...')

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


        if (
            currentMeta &&
            page > Number(
                currentMeta.lastPage
            )
        ) {

            return

        }


        await loadSchools(
            page
        )

    }


    /*
    |--------------------------------------------------------------------------
    | CREATE
    |--------------------------------------------------------------------------
    */

    let adminUserSearchTimer = null

    function updateSchoolAdminMode() {
        const mode =
            document.querySelector('input[name="admin_mode"]:checked')?.value ||
            'new'

        document
            .getElementById('newAdminSection')
            ?.classList.toggle('hidden', mode !== 'new')

        document
            .getElementById('existingAdminSection')
            ?.classList.toggle('hidden', mode !== 'existing')

        ;[
            'create_admin_prenom',
            'create_admin_nom',
            'create_admin_email',
            'create_admin_password',
            'create_admin_password_confirmation',
        ].forEach(
            id => {
                const field = document.getElementById(id)
                if (field) field.required = mode === 'new'
            }
        )
    }

    function renderSchoolAdminUsers(items) {
        const container =
            document.getElementById(
                'create_admin_userResults'
            )

        if (!container) return

        container.innerHTML =
            items.length
                ? items.map(
                    user => `
                        <button
                            type="button"
                            data-admin-user-id="${user.id}"
                            class="block w-full border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50"
                        >
                            <div class="flex items-start justify-between gap-3">
                                <div>
                                    <div class="text-sm font-semibold text-slate-800">
                                        ${escapeHtml(`${user.prenom || ''} ${user.nom || ''}`.trim() || 'Utilisateur')}
                                    </div>
                                    <div class="mt-1 text-xs text-slate-400">
                                        ${escapeHtml(user.email || user.telephone || '')}
                                    </div>
                                </div>
                                <span class="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                                    ${escapeHtml(user.systemRole || 'USER')}
                                </span>
                            </div>
                        </button>
                    `
                ).join('')
                : `<div class="px-4 py-3 text-sm text-slate-400">Aucun utilisateur trouvé.</div>`

        container.classList.remove('hidden')

        container
            .querySelectorAll('[data-admin-user-id]')
            .forEach(
                button => {
                    button.addEventListener(
                        'click',
                        () => {
                            const user =
                                items.find(
                                    item =>
                                        String(item.id) ===
                                        String(button.dataset.adminUserId)
                                )

                            if (!user) return

                            document
                                .getElementById(
                                    'create_admin_userId'
                                )
                                .value = user.id

                            document
                                .getElementById(
                                    'create_admin_userSearch'
                                )
                                .value =
                                    `${user.prenom || ''} ${user.nom || ''}`.trim()

                            const selected =
                                document.getElementById(
                                    'create_admin_userSelected'
                                )

                            selected.textContent =
                                `Utilisateur sélectionné : ${`${user.prenom || ''} ${user.nom || ''}`.trim()} • ${user.email || 'sans email'}`

                            selected.classList.remove('hidden')
                            container.classList.add('hidden')
                        }
                    )
                }
            )
    }

    async function searchSchoolAdminUsers(keyword) {
    const value =
        String(keyword || '').trim()

    if (value.length < 2) {
        document
            .getElementById(
                'create_admin_userResults'
            )
            ?.classList.add('hidden')

        return
    }

    const response =
        await apiRequest(
            `/api/super-admin/utilisateurs/search?keyword=${encodeURIComponent(value)}&limit=10`
        )

    const result =
        await parseResponse(response)

    if (!response.ok || !result?.success) {
        throw new Error(
            result?.message ||
            'Impossible de rechercher les utilisateurs.'
        )
    }

    renderSchoolAdminUsers(
        result.data || []
    )
}

    function openCreateModal() {
        const modal =
            document.getElementById(
                'createModal'
            )

        const content =
            document.getElementById(
                'createModalContent'
            )

        document
            .getElementById(
                'createSchoolForm'
            )
            ?.reset()

        document
            .getElementById(
                'createFormError'
            )
            ?.classList.add('hidden')

        document
            .getElementById(
                'create_admin_userId'
            )
            .value = ''

        document
            .getElementById(
                'create_admin_userSelected'
            )
            ?.classList.add('hidden')

        document
            .getElementById(
                'create_admin_userResults'
            )
            ?.classList.add('hidden')

        const mode =
            document.querySelector(
                'input[name="admin_mode"][value="new"]'
            )

        if (mode) mode.checked = true

        updateSchoolAdminMode()

        modal.classList.remove('hidden')
        modal.classList.add('flex')

        setTimeout(
            () => {
                modal.classList.remove(
                    'opacity-0'
                )

                content.classList.add(
                    'scale-100'
                )
            },
            10
        )
    }

    function closeCreateModal() {
        const modal =
            document.getElementById(
                'createModal'
            )

        const content =
            document.getElementById(
                'createModalContent'
            )

        modal.classList.add(
            'opacity-0'
        )

        content.classList.remove(
            'scale-100'
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

    async function createSchool(event) {
        event.preventDefault()

        const formData =
            new FormData(
                event.target
            )

        const errorElement =
            document.getElementById(
                'createFormError'
            )

        const submitButton =
            document.getElementById(
                'submitCreateButton'
            )

        const adminMode =
            String(
                formData.get(
                    'admin_mode'
                ) ||
                'new'
            )

        errorElement.classList.add(
            'hidden'
        )

        errorElement.textContent =
            ''

        const payload = {
            nom:
                String(
                    formData.get('nom') ||
                    ''
                ).trim(),

            code:
                String(
                    formData.get('code') ||
                    ''
                ).trim(),

            type:
                String(
                    formData.get('type') ||
                    ''
                ).trim(),

            email:
                String(
                    formData.get('email') ||
                    ''
                ).trim(),

            telephone:
                String(
                    formData.get('telephone') ||
                    ''
                ).trim(),

            siteWeb:
                String(
                    formData.get('siteWeb') ||
                    ''
                ).trim(),

            description:
                String(
                    formData.get(
                        'description'
                    ) ||
                    ''
                ).trim(),

            province:
                String(
                    formData.get('province') ||
                    ''
                ).trim(),

            ville:
                String(
                    formData.get('ville') ||
                    ''
                ).trim(),

            commune:
                String(
                    formData.get('commune') ||
                    ''
                ).trim(),

            quartier:
                String(
                    formData.get('quartier') ||
                    ''
                ).trim(),

            adresse:
                String(
                    formData.get('adresse') ||
                    ''
                ).trim(),
        }

        if (!payload.nom) {
            errorElement.textContent =
                'Le nom de l’école est obligatoire.'

            errorElement.classList.remove(
                'hidden'
            )

            return
        }

        if (
            adminMode ===
            'existing'
        ) {
            const userId =
                Number(
                    formData.get(
                        'admin_userId'
                    ) ||
                    0
                )

            if (!userId) {
                errorElement.textContent =
                    'Veuillez sélectionner un utilisateur existant.'

                errorElement.classList.remove(
                    'hidden'
                )

                return
            }

            payload.admin = {
                mode:
                    'existing',

                userId,
            }
        } else {
            const password =
                String(
                    formData.get(
                        'admin_password'
                    ) ||
                    ''
                )

            const confirmation =
                String(
                    formData.get(
                        'admin_password_confirmation'
                    ) ||
                    ''
                )

            if (
                password.length <
                8
            ) {
                errorElement.textContent =
                    'Le mot de passe administrateur doit contenir au moins 8 caractères.'

                errorElement.classList.remove(
                    'hidden'
                )

                return
            }

            if (
                password !==
                confirmation
            ) {
                errorElement.textContent =
                    'Les mots de passe administrateur ne correspondent pas.'

                errorElement.classList.remove(
                    'hidden'
                )

                return
            }

            payload.admin = {
                mode:
                    'new',

                prenom:
                    String(
                        formData.get(
                            'admin_prenom'
                        ) ||
                        ''
                    ).trim(),

                nom:
                    String(
                        formData.get(
                            'admin_nom'
                        ) ||
                        ''
                    ).trim(),

                postnom:
                    String(
                        formData.get(
                            'admin_postnom'
                        ) ||
                        ''
                    ).trim(),

                pseudo:
                    String(
                        formData.get(
                            'admin_pseudo'
                        ) ||
                        ''
                    ).trim(),

                email:
                    String(
                        formData.get(
                            'admin_email'
                        ) ||
                        ''
                    ).trim(),

                telephone:
                    String(
                        formData.get(
                            'admin_telephone'
                        ) ||
                        ''
                    ).trim(),

                password,

                password_confirmation:
                    confirmation,
            }
        }

        submitButton.disabled =
            true

        submitButton.innerHTML =
            `<i class="fa-solid fa-spinner fa-spin mr-2"></i>${adminMode === 'existing' ? 'Création et rattachement...' : 'Création...'}`

        try {
            const response =
                await apiRequest(
                    '/api/super-admin/ecoles',
                    {
                        method:
                            'POST',

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
                let message =
                    result?.message ||
                    'Impossible de créer l’école.'

                if (
                    Array.isArray(
                        result?.errors
                    ) &&
                    result.errors.length
                ) {
                    message =
                        result.errors
                            .map(
                                error =>
                                    error.message
                            )
                            .join(' ')
                }

                throw new Error(
                    message
                )
            }

            closeCreateModal()

            showSuccess(
                result.message ||
                'École créée avec succès.'
            )

            await refreshAll()
        } catch (
            error
        ) {
            console.error(
                'Création école:',
                error
            )

            errorElement.textContent =
                error.message ||
                'Une erreur est survenue lors de la création.'

            errorElement.classList.remove(
                'hidden'
            )
        } finally {
            submitButton.disabled =
                false

            submitButton.innerHTML =
                '<i class="fa-solid fa-school mr-2"></i>Créer l’école'
        }
    }

/*
    |--------------------------------------------------------------------------
    | DETAILS
    |--------------------------------------------------------------------------
    */

    async function viewSchool(id) {

    try {

        const response = await apiRequest(
            `/api/super-admin/ecoles/${id}`
        )


        const result =
            await parseResponse(response)


        if (
            !response.ok ||
            !result?.success
        ) {

            throw new Error(
                result?.message ||
                'Impossible de récupérer les informations de cette école.'
            )

        }


        renderSchoolDetails(
            result.data
        )


        openDetailsModal()


    } catch (error) {

        console.error(
            'Erreur détails école:',
            error
        )


        showPageError(
            error.message ||
            'Impossible de récupérer les informations de cette école.'
        )

    }

}




    function renderSchoolDetails(
    school
) {

    document
        .getElementById(
            'detailsSchoolName'
        )
        .textContent =
        school.nom || 'École'


    document
        .getElementById(
            'detailsSchoolId'
        )
        .textContent =
        school.code || '—'


    document
        .getElementById(
            'detailsStudents'
        )
        .textContent =
        formatNumber(
            school.nombreEleves
        )


    document
        .getElementById(
            'detailsUsers'
        )
        .textContent =
        formatNumber(
            school.nombreUtilisateurs
        )


    document
        .getElementById(
            'detailsClasses'
        )
        .textContent =
        formatNumber(
            school.nombreClasses
        )


    const status =
        getStatusPresentation(
            school.statut
        )


    const statusElement =
        document.getElementById(
            'detailsStatus'
        )


    statusElement.textContent =
        status.label


    statusElement.className =
        `mt-2 text-sm font-semibold ${
            status.textClass
        }`


    const details = {

        detailsProvince:
            school.province,

        detailsVille:
            school.ville,

        detailsCommune:
            school.commune,

        detailsQuartier:
            school.quartier,

        detailsEmail:
            school.email,

        detailsTelephone:
            school.telephone,

        detailsAdresse:
            school.adresse,

        detailsType:
            school.type,

        detailsCreatedAt:
            formatDate(
                school.createdAt
            ),

    }


    Object.entries(
        details
    ).forEach(
        (
            [
                id,
                value,
            ]
        ) => {

            const element =
                document.getElementById(
                    id
                )


            if (element) {

                element.textContent =
                    value || '—'

            }

        }
    )


    renderAdministrators(
        school.administrateurs || []
    )

}


    function openDetailsModal() {

        const modal =
            document.getElementById(
                'detailsModal'
            )


        modal.classList.remove(
            'hidden'
        )

        modal.classList.add(
            'flex'
        )


        setTimeout(
            () => {

                modal.classList.remove(
                    'opacity-0'
                )

            },
            10
        )

    }


    function closeDetailsModal() {

        const modal =
            document.getElementById(
                'detailsModal'
            )


        modal.classList.add(
            'opacity-0'
        )


        setTimeout(
            () => {

                modal.classList.add(
                    'hidden'
                )

                modal.classList.remove(
                    'flex'
                )

            },
            200
        )

    }


    /*
    |--------------------------------------------------------------------------
    | EDIT
    |--------------------------------------------------------------------------
    */

    async function editSchool(id) {

    try {

        const response =
            await apiRequest(
                `/api/super-admin/ecoles/${id}`
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
                'Impossible de récupérer les informations de cette école.'
            )

        }


        fillEditForm(
            result.data
        )


        openEditModal()


    } catch (
        error
    ) {

        console.error(
            'Erreur modification école:',
            error
        )


        showPageError(
            error.message ||
            'Impossible de récupérer les informations de cette école.'
        )

    }

}


    function renderAdministrators(
    administrators
) {

    const container =
        document.getElementById(
            'detailsAdministrators'
        )


    if (!container) {
        return
    }


    if (
        !administrators.length
    ) {

        container.innerHTML = `

            <div
                class="
                    rounded-xl
                    bg-slate-50
                    px-4
                    py-4
                    text-sm
                    text-slate-400
                "
            >
                Aucun administrateur actif.
            </div>

        `

        return
    }


    container.innerHTML =
        administrators
            .map(
                administrator => {

                    const initials =
                        `${administrator.prenom || ''}${administrator.nom || ''}`
                            .slice(0, 2)
                            .toUpperCase()


                    const name =
                        `${administrator.prenom || ''} ${administrator.nom || ''}`
                            .trim()


                    return `

                        <div
                            class="
                                flex
                                items-center
                                gap-3
                                rounded-xl
                                bg-slate-50
                                p-4
                            "
                        >

                            <div
                                class="
                                    flex
                                    h-11
                                    w-11
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-sky-100
                                    font-bold
                                    text-sky-600
                                "
                            >
                                ${escapeHtml(
                                    initials || 'AD'
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
                                        name || 'Administrateur'
                                    )}
                                </p>


                                <p
                                    class="
                                        mt-1
                                        truncate
                                        text-xs
                                        text-slate-400
                                    "
                                >
                                    ${escapeHtml(
                                        administrator.email || ''
                                    )}
                                </p>

                            </div>

                        </div>

                    `

                }
            )
            .join('')

}


  function fillEditForm(
    school
) {

    const values = {

        edit_id:
            school.id,

        edit_nom:
            school.nom,

        edit_code:
            school.code,

        edit_type:
            school.type,

        edit_email:
            school.email,

        edit_telephone:
            school.telephone,

        edit_province:
            school.province,

        edit_ville:
            school.ville,

        edit_commune:
            school.commune,

        edit_quartier:
            school.quartier,

        edit_adresse:
            school.adresse,

        edit_description:
            school.description,

        edit_statut:
            school.statut,

        edit_siteWeb:
            school.siteWeb,

    }


    Object.entries(
        values
    ).forEach(
        (
            [
                id,
                value,
            ]
        ) => {

            const element =
                document.getElementById(
                    id
                )


            if (element) {

                element.value =
                    value ?? ''

            }

        }
    )


    document
        .getElementById(
            'editSchoolSubtitle'
        )
        .textContent =
        `${school.nom || ''} • ${school.code || ''}`

}


    function openEditModal() {

        const modal =
            document.getElementById(
                'editModal'
            )


        modal.classList.remove(
            'hidden'
        )

        modal.classList.add(
            'flex'
        )


        setTimeout(
            () => {

                modal.classList.remove(
                    'opacity-0'
                )

            },
            10
        )

    }


    function closeEditModal() {

        const modal =
            document.getElementById(
                'editModal'
            )


        modal.classList.add(
            'opacity-0'
        )


        setTimeout(
            () => {

                modal.classList.add(
                    'hidden'
                )

                modal.classList.remove(
                    'flex'
                )

            },
            200
        )

    }


    async function updateSchool(
        event
    ) {

        event.preventDefault()


        const form =
            event.target


        const id =
            document
                .getElementById(
                    'edit_id'
                )
                .value


        const errorElement =
            document.getElementById(
                'editFormError'
            )


        const submitButton =
            document.getElementById(
                'submitEditButton'
            )


        errorElement.classList.add(
            'hidden'
        )


        const formData =
            new FormData(
                form
            )


        const payload = {

            nom:
                formData.get(
                    'nom'
                ),

            code:
                formData.get(
                    'code'
                ),

            type:
                formData.get(
                    'type'
                ),

            email:
                formData.get(
                    'email'
                ),

            telephone:
                formData.get(
                    'telephone'
                ),

            province:
                formData.get(
                    'province'
                ),

            ville:
                formData.get(
                    'ville'
                ),

            commune:
                formData.get(
                    'commune'
                ),

            quartier:
                formData.get(
                    'quartier'
                ),

            adresse:
                formData.get(
                    'adresse'
                ),

            description:
                formData.get(
                    'description'
                ),

            statut:
                formData.get(
                    'statut'
                ),

            siteWeb:
                formData.get(
                    'siteWeb'
                ),

        }


        submitButton.disabled =
            true


        submitButton.textContent =
            'Enregistrement...'


        try {

            const response =
                await apiRequest(
                    `/api/super-admin/ecoles/${id}`,
                    {

                        method:
                            'PUT',

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
                    'Impossible de modifier l’école.'
                )

            }


            closeEditModal()


            showSuccess(
                result.message ||
                'École modifiée avec succès.'
            )


            await refreshAll()

        } catch (
            error
        ) {

            errorElement.textContent =
                error.message


            errorElement.classList.remove(
                'hidden'
            )

        } finally {

            submitButton.disabled =
                false


            submitButton.textContent =
                'Enregistrer'

        }

    }


    /*
    |--------------------------------------------------------------------------
    | CONFIRMATION
    |--------------------------------------------------------------------------
    */

    function openConfirmModal(
        title,
        message,
        callback,
        type = 'warning'
    ) {

        confirmCallback =
            callback


        const titleElement =
            document.getElementById(
                'confirmTitle'
            )


        const messageElement =
            document.getElementById(
                'confirmMessage'
            )


        const button =
            document.getElementById(
                'confirmActionButton'
            )


        const icon =
            document.getElementById(
                'confirmIcon'
            )


        titleElement.textContent =
            title


        messageElement.textContent =
            message


        if (
            type === 'danger'
        ) {

            button.className =
                `
                    flex-1
                    rounded-xl
                    bg-red-500
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    hover:bg-red-600
                `

            button.textContent =
                'Supprimer'


            icon.className =
                `
                    mx-auto
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-2xl
                    bg-red-50
                    text-red-500
                `


            icon.innerHTML =
                '<i class="fa-solid fa-trash text-xl"></i>'

        } else if (
            type === 'success'
        ) {

            button.className =
                `
                    flex-1
                    rounded-xl
                    bg-emerald-500
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    hover:bg-emerald-600
                `

            button.textContent =
                'Réactiver'


            icon.className =
                `
                    mx-auto
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-2xl
                    bg-emerald-50
                    text-emerald-500
                `


            icon.innerHTML =
                '<i class="fa-solid fa-check text-xl"></i>'

        } else {

            button.className =
                `
                    flex-1
                    rounded-xl
                    bg-amber-500
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    hover:bg-amber-600
                `

            button.textContent =
                'Confirmer'


            icon.className =
                `
                    mx-auto
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-2xl
                    bg-amber-50
                    text-amber-500
                `


            icon.innerHTML =
                '<i class="fa-solid fa-triangle-exclamation text-xl"></i>'

        }


        const modal =
            document.getElementById(
                'confirmModal'
            )


        modal.classList.remove(
            'hidden'
        )

        modal.classList.add(
            'flex'
        )


        setTimeout(
            () => {

                modal.classList.remove(
                    'opacity-0'
                )

            },
            10
        )

    }


    function closeConfirmModal() {

        const modal =
            document.getElementById(
                'confirmModal'
            )


        modal.classList.add(
            'opacity-0'
        )


        setTimeout(
            () => {

                modal.classList.add(
                    'hidden'
                )

                modal.classList.remove(
                    'flex'
                )

                confirmCallback =
                    null

            },
            200
        )

    }


    document
        .getElementById(
            'confirmActionButton'
        )
        .addEventListener(
            'click',
            async () => {

                if (
                    typeof confirmCallback ===
                    'function'
                ) {

                    await confirmCallback()

                }


                closeConfirmModal()

            }
        )


    /*
    |--------------------------------------------------------------------------
    | SCHOOL ACTIONS
    |--------------------------------------------------------------------------
    */

    async function suspendSchool(
    id
) {

    const school =
        currentSchools.find(
            item =>
                Number(item.id) ===
                Number(id)
        )


    if (!school) {
        return
    }


    openConfirmModal(

        'Suspendre l’école ?',

        `L’école « ${school.nom} » sera suspendue.`,

        async () => {

            const response =
                await apiRequest(
                    `/api/super-admin/ecoles/${id}/suspend`,
                    {
                        method: 'PATCH',
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
                    'Impossible de suspendre l’école.'
                )

            }


            showSuccess(
                result.message ||
                'École suspendue avec succès.'
            )


            await refreshAll()

        }

    )

}


    async function activateSchool(
    id
) {

    const school =
        currentSchools.find(
            item =>
                Number(item.id) ===
                Number(id)
        )


    if (!school) {
        return
    }


    openConfirmModal(

        'Réactiver l’école ?',

        `L’école « ${school.nom} » sera de nouveau active.`,

        async () => {

            const response =
                await apiRequest(
                    `/api/super-admin/ecoles/${id}/activate`,
                    {
                        method: 'PATCH',
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
                    'Impossible de réactiver l’école.'
                )

            }


            showSuccess(
                result.message ||
                'École réactivée avec succès.'
            )


            await refreshAll()

        },

        'success'

    )

}


    async function deleteSchool(
    id
) {

    const school =
        currentSchools.find(
            item =>
                Number(item.id) ===
                Number(id)
        )


    if (!school) {
        return
    }


    openConfirmModal(

        'Supprimer l’école ?',

        `L’école « ${school.nom} » sera archivée et ne sera plus considérée comme active.`,

        async () => {

            const response =
                await apiRequest(
                    `/api/super-admin/ecoles/${id}`,
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
                    'Impossible de supprimer l’école.'
                )

            }


            showSuccess(
                result.message ||
                'École supprimée avec succès.'
            )


            await refreshAll()

        },

        'danger'

    )

}


    /*
    |--------------------------------------------------------------------------
    | FILTERS
    |--------------------------------------------------------------------------
    */

    let searchTimeout = null


    document
        .getElementById(
            'searchInput'
        )
        .addEventListener(
            'input',
            () => {

                clearTimeout(
                    searchTimeout
                )


                searchTimeout =
                    setTimeout(
                        () => {

                            loadSchools(
                                1
                            )
                                .catch(
                                    error =>
                                        showPageError(
                                            error.message
                                        )
                                )

                        },
                        350
                    )

            }
        )


    document
        .getElementById(
            'statusFilter'
        )
        .addEventListener(
            'change',
            () => {

                loadSchools(
                    1
                )
                    .catch(
                        error =>
                            showPageError(
                                error.message
                            )
                    )

            }
        )


    document
        .getElementById(
            'provinceFilter'
        )
        .addEventListener(
            'change',
            () => {

                loadSchools(
                    1
                )
                    .catch(
                        error =>
                            showPageError(
                                error.message
                            )
                    )

            }
        )


    document
        .getElementById(
            'resetFiltersButton'
        )
        .addEventListener(
            'click',
            () => {

                document
                    .getElementById(
                        'searchInput'
                    )
                    .value = ''


                document
                    .getElementById(
                        'statusFilter'
                    )
                    .value = ''


                document
                    .getElementById(
                        'provinceFilter'
                    )
                    .value = ''


                loadSchools(
                    1
                )
                    .catch(
                        error =>
                            showPageError(
                                error.message
                            )
                    )

            }
        )


    /*
    |--------------------------------------------------------------------------
    | REFRESH GLOBAL
    |--------------------------------------------------------------------------
    */

    async function refreshAll() {

        await Promise.all([

            loadSchools(
                currentPage
            ),

            loadSummary(),

        ])

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

                            Authorization:
                                `Bearer ${token}`,

                            Accept:
                                'application/json',

                        },

                    }
                )

            }

        } catch (error) {

            console.error(
                'Logout:',
                error
            )

        } finally {

            sessionStorage.clear()

            window.location.replace('/')

        }

    }


    /*
    |--------------------------------------------------------------------------
    | SIDEBAR
    |--------------------------------------------------------------------------
    */

    const sidebar =
        document.getElementById(
            'sidebar'
        )


    const overlay =
        document.getElementById(
            'sidebarOverlay'
        )


    document
        .getElementById(
            'openSidebar'
        )
        .addEventListener(
            'click',
            () => {

                sidebar.classList.remove(
                    '-translate-x-full'
                )

                overlay.classList.remove(
                    'hidden'
                )


                setTimeout(
                    () => {

                        overlay.classList.remove(
                            'opacity-0'
                        )

                    },
                    10
                )

            }
        )


    function hideSidebar() {

        sidebar.classList.add(
            '-translate-x-full'
        )

        overlay.classList.add(
            'opacity-0'
        )


        setTimeout(
            () => {

                overlay.classList.add(
                    'hidden'
                )

            },
            300
        )

    }


    overlay.addEventListener(
        'click',
        hideSidebar
    )


    /*
    |--------------------------------------------------------------------------
    | MODALS
    |--------------------------------------------------------------------------
    */

    document
        .getElementById(
            'createSchoolButton'
        )
        .addEventListener(
            'click',
            openCreateModal
        )


    document
        .getElementById(
            'closeCreateModal'
        )
        .addEventListener(
            'click',
            closeCreateModal
        )


    document
        .getElementById(
            'cancelCreateButton'
        )
        .addEventListener(
            'click',
            closeCreateModal
        )


    document
        .getElementById(
            'createSchoolForm'
        )
        .addEventListener(
            'submit',
            createSchool
        )


    document
        .getElementById(
            'closeDetailsModal'
        )
        .addEventListener(
            'click',
            closeDetailsModal
        )


    document
        .getElementById(
            'closeDetailsButton'
        )
        .addEventListener(
            'click',
            closeDetailsModal
        )


    document
        .getElementById(
            'closeEditModal'
        )
        .addEventListener(
            'click',
            closeEditModal
        )


    document
        .getElementById(
            'cancelEditButton'
        )
        .addEventListener(
            'click',
            closeEditModal
        )


    document
        .getElementById(
            'editSchoolForm'
        )
        .addEventListener(
            'submit',
            updateSchool
        )


    document
        .getElementById(
            'cancelConfirmButton'
        )
        .addEventListener(
            'click',
            closeConfirmModal
        )


    document
        .getElementById(
            'createModal'
        )
        .addEventListener(
            'click',
            (
                event
            ) => {

                if (
                    event.target ===
                    event.currentTarget
                ) {

                    closeCreateModal()

                }

            }
        )


    document
        .getElementById(
            'detailsModal'
        )
        .addEventListener(
            'click',
            (
                event
            ) => {

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
            'editModal'
        )
        .addEventListener(
            'click',
            (
                event
            ) => {

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
            'confirmModal'
        )
        .addEventListener(
            'click',
            (
                event
            ) => {

                if (
                    event.target ===
                    event.currentTarget
                ) {

                    closeConfirmModal()

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
        (
            event
        ) => {

            if (
                event.key ===
                'Escape'
            ) {

                closeCreateModal()

                closeDetailsModal()

                closeEditModal()

                closeConfirmModal()

                hideSidebar()

            }

        }
    )


    /*
    |--------------------------------------------------------------------------
    | INITIALISATION
    |--------------------------------------------------------------------------
    */

    document.addEventListener(
        'DOMContentLoaded',
        async () => {

            if (
                window.lucide
            ) {

                window.lucide.createIcons()

            }


            renderCurrentUser()


            try {

                await refreshAll()

            } catch (
                error
            ) {

                console.error(
                    'Initialisation écoles:',
                    error
                )


                showPageError(
                    error.message ||
                    'Impossible de charger la page des écoles.'
                )

            }

        }
    )

    document
        .querySelectorAll(
            'input[name="admin_mode"]'
        )
        .forEach(
            input =>
                input.addEventListener(
                    'change',
                    updateSchoolAdminMode
                )
        )

    document
        .getElementById(
            'create_admin_userSearch'
        )
        ?.addEventListener(
            'input',
            event => {
                clearTimeout(
                    adminUserSearchTimer
                )

                adminUserSearchTimer =
                    setTimeout(
                        () =>
                            searchSchoolAdminUsers(
                                event.target.value
                            ).catch(
                                error =>
                                    showPageError(
                                        error.message
                                    )
                            ),
                        250
                    )
            }
        )

    document.addEventListener(
        'click',
        event => {
            if (
                !event.target.closest(
                    '#create_admin_userSearch, #create_admin_userResults'
                )
            ) {
                document
                    .getElementById(
                        'create_admin_userResults'
                    )
                    ?.classList.add('hidden')
            }
        }
    )

