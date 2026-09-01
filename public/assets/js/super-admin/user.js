  /*
    |--------------------------------------------------------------------------
    | CONFIGURATION
    |--------------------------------------------------------------------------
    */

    const TOKEN_KEY =
        'smart_school_access_token'

    const USER_KEY =
        'smart_school_user'


    let currentPage =
        1

    let currentMeta =
        null

    let currentAdministrators =
        []

    let allSchools =
        []

    let confirmationCallback =
        null


    /*
    |--------------------------------------------------------------------------
    | UTILITAIRES
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
            return 'Jamais'
        }


        const date =
            new Date(value)


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return 'Inconnue'

        }


        return new Intl.DateTimeFormat(
            'fr-FR',
            {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }
        ).format(
            date
        )

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
            .classList.add(
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


        setTimeout(
            () => {

                element.classList.add(
                    'hidden'
                )

            },
            4000
        )

    }


    async function parseJson(
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

                        ...(options.headers || {}),

                        Authorization:
                            `Bearer ${token}`,

                        Accept:
                            'application/json',

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


        if (
            response.status ===
            403
        ) {

            throw new Error(
                'Accès refusé.'
            )

        }


        return response

    }


    /*
    |--------------------------------------------------------------------------
    | UTILISATEUR CONNECTÉ
    |--------------------------------------------------------------------------
    */

    function renderCurrentUser() {

        const raw =
            sessionStorage.getItem(
                USER_KEY
            )


        if (!raw) {
            return
        }


        try {

            const user =
                JSON.parse(
                    raw
                )


            const fullName =
                `${user.prenom || ''} ${user.nom || ''}`
                    .trim()


            const initials =
                `${user.prenom || ''}${user.nom || ''}`
                    .slice(0, 2)
                    .toUpperCase()
                    || 'SA'


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
                fullName ||
                'Super Administrateur'


            document
                .getElementById(
                    'sidebarUserName'
                )
                .textContent =
                fullName ||
                'Super Administrateur'


            document
                .getElementById(
                    'sidebarUserEmail'
                )
                .textContent =
                user.email || ''

        } catch {

            return

        }

    }


    /*
    |--------------------------------------------------------------------------
    | STATISTIQUES
    |--------------------------------------------------------------------------
    */

    async function loadStatistics() {

        const response =
            await apiRequest(
                '/api/super-admin/administrateurs/statistics'
            )


        const result =
            await parseJson(
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
            result.data


        document
            .getElementById(
                'statTotal'
            )
            .textContent =
            formatNumber(
                data.total
            )


        document
            .getElementById(
                'statActive'
            )
            .textContent =
            formatNumber(
                data.actifs
            )


        document
            .getElementById(
                'statInactive'
            )
            .textContent =
            formatNumber(
                data.inactifs
            )


        document
            .getElementById(
                'statNew'
            )
            .textContent =
            `+${formatNumber(data.nouveaux)} ce mois`


        document
            .getElementById(
                'statActivePercent'
            )
            .textContent =
            `${data.tauxActifs}% du total`


        document
            .getElementById(
                'statLoginRate'
            )
            .textContent =
            `${data.tauxAvecConnexion}%`


        document
            .getElementById(
                'statNeverLogin'
            )
            .textContent =
            `${formatNumber(data.jamaisConnectes)} jamais connectés`

    }


    /*
    |--------------------------------------------------------------------------
    | ÉCOLES POUR LES FILTRES
    |--------------------------------------------------------------------------
    */

    async function loadSchools() {

        const response =
            await apiRequest(
                '/api/super-admin/ecoles?limit=100&statut=ACTIF'
            )


        const result =
            await parseJson(
                response
            )


        if (
            !response.ok ||
            !result?.success
        ) {

            return

        }


        allSchools =
            result.data?.data || []


        const filter =
            document.getElementById(
                'schoolFilter'
            )


        const createSelect =
            document.getElementById(
                'create_ecoleId'
            )


        const options =
            allSchools
                .map(
                    school => `

                        <option value="${school.id}">
                            ${escapeHtml(school.nom)}
                        </option>

                    `
                )
                .join('')


        filter.innerHTML =
            `
                <option value="">
                    Toutes les écoles
                </option>
                ${options}
            `


        createSelect.innerHTML =
            `
                <option value="">
                    Sélectionner une école
                </option>
                ${options}
            `

    }


    /*
    |--------------------------------------------------------------------------
    | LISTE
    |--------------------------------------------------------------------------
    */

    async function loadAdministrators(
        page = 1
    ) {

        hidePageError()


        const search =
            document
                .getElementById(
                    'searchUser'
                )
                .value
                .trim()


        const statut =
            document
                .getElementById(
                    'statusFilter'
                )
                .value


        const ecoleId =
            document
                .getElementById(
                    'schoolFilter'
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


        if (ecoleId) {

            params.set(
                'ecoleId',
                ecoleId
            )

        }


        const response =
            await apiRequest(
                `/api/super-admin/administrateurs?${params.toString()}`
            )


        const result =
            await parseJson(
                response
            )


        if (
            !response.ok ||
            !result?.success
        ) {

            throw new Error(
                result?.message ||
                'Impossible de charger les administrateurs.'
            )

        }


        currentPage =
            page


        currentMeta =
            result.data?.meta ||
            null


        currentAdministrators =
            result.data?.data ||
            []


        renderAdministrators(
            currentAdministrators
        )


        renderPagination(
            currentMeta
        )


        const total =
            Number(
                currentMeta?.total ||
                0
            )


        document
            .getElementById(
                'resultCount'
            )
            .textContent =
            `${formatNumber(total)} ${
                total > 1
                    ? 'administrateurs'
                    : 'administrateur'
            }`

    }


    function renderAdministrators(
        administrators
    ) {

        const tbody =
            document.getElementById(
                'userTable'
            )


        const empty =
            document.getElementById(
                'emptyState'
            )


        if (!administrators.length) {

            tbody.innerHTML =
                ''


            empty.classList.remove(
                'hidden'
            )


            return

        }


        empty.classList.add(
            'hidden'
        )


        tbody.innerHTML =
            administrators
                .map(
                    admin => {

                        const initials =
                            `${admin.prenom || ''}${admin.nom || ''}`
                                .slice(0, 2)
                                .toUpperCase()
                                || 'AD'


                        const fullName =
                            `${admin.prenom || ''} ${admin.nom || ''}`
                                .trim()


                        const school =
                            admin.ecoles?.[0]


                        const status =
                            getStatus(
                                admin.statut
                            )


                        return `

                            <tr class="hover:bg-slate-50">

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
                                                bg-primary-100
                                                font-bold
                                                text-primary-600
                                            "
                                        >
                                            ${escapeHtml(initials)}
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
                                                ${escapeHtml(
                                                    fullName ||
                                                    'Administrateur'
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
                                                ID #${admin.id}
                                            </p>

                                        </div>

                                    </div>

                                </td>


                                <td class="px-6 py-4">

                                    <p
                                        class="
                                            text-sm
                                            font-medium
                                            text-slate-700
                                        "
                                    >
                                        ${escapeHtml(
                                            school?.nom ||
                                            'Aucune école'
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
                                            school?.code ||
                                            ''
                                        )}
                                    </p>

                                </td>


                                <td class="px-6 py-4">

                                    <p class="text-sm text-slate-600">
                                        ${escapeHtml(
                                            admin.email || '—'
                                        )}
                                    </p>

                                </td>


                                <td class="px-6 py-4">

                                    <span
                                        class="
                                            text-sm
                                            text-slate-600
                                        "
                                    >
                                        ${formatDate(
                                            admin.lastLoginAt
                                        )}
                                    </span>

                                </td>


                                <td class="px-6 py-4">

                                    <span
                                        class="
                                            inline-flex
                                            items-center
                                            gap-2
                                            rounded-full
                                            px-3
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
                                                ${status.dot}
                                            "
                                        ></span>

                                        ${status.label}

                                    </span>

                                </td>


                                <td class="px-6 py-4">

                                    <div
                                        class="
                                            flex
                                            justify-end
                                            gap-1
                                        "
                                    >

                                        <button
                                            type="button"
                                            title="Afficher"
                                            class="
                                                action-btn
                                                text-slate-500
                                                hover:bg-sky-50
                                                hover:text-sky-600
                                            "
                                            onclick="viewAdministrator(${admin.id})"
                                        >
                                            <i class="fa-regular fa-eye"></i>
                                        </button>


                                        <button
                                            type="button"
                                            title="Modifier"
                                            class="
                                                action-btn
                                                text-slate-500
                                                hover:bg-indigo-50
                                                hover:text-indigo-600
                                            "
                                            onclick="editAdministrator(${admin.id})"
                                        >
                                            <i class="fa-solid fa-pen"></i>
                                        </button>


                                        ${
                                            admin.statut ===
                                            'ACTIF'
                                                ? `
                                                    <button
                                                        type="button"
                                                        title="Suspendre"
                                                        class="
                                                            action-btn
                                                            text-slate-500
                                                            hover:bg-amber-50
                                                            hover:text-amber-600
                                                        "
                                                        onclick="suspendAdministrator(${admin.id})"
                                                    >
                                                        <i class="fa-solid fa-user-lock"></i>
                                                    </button>
                                                `
                                                : admin.statut ===
                                                  'INACTIF'
                                                    ? `
                                                        <button
                                                            type="button"
                                                            title="Réactiver"
                                                            class="
                                                                action-btn
                                                                text-slate-500
                                                                hover:bg-emerald-50
                                                                hover:text-emerald-600
                                                            "
                                                            onclick="activateAdministrator(${admin.id})"
                                                        >
                                                            <i class="fa-solid fa-user-check"></i>
                                                        </button>
                                                    `
                                                    : ''
                                        }


                                        ${
                                            admin.statut !==
                                            'SUPPRIME'
                                                ? `
                                                    <button
                                                        type="button"
                                                        title="Supprimer"
                                                        class="
                                                            action-btn
                                                            text-slate-500
                                                            hover:bg-red-50
                                                            hover:text-red-600
                                                        "
                                                        onclick="deleteAdministrator(${admin.id})"
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


    function getStatus(
        status
    ) {

        switch (
            String(status || '').toUpperCase()
        ) {

            case 'ACTIF':

                return {

                    label:
                        'Actif',

                    className:
                        'bg-emerald-50 text-emerald-700',

                    dot:
                        'bg-emerald-500',

                }


            case 'INACTIF':

                return {

                    label:
                        'Suspendu',

                    className:
                        'bg-amber-50 text-amber-700',

                    dot:
                        'bg-amber-500',

                }


            case 'SUPPRIME':

                return {

                    label:
                        'Supprimé',

                    className:
                        'bg-red-50 text-red-700',

                    dot:
                        'bg-red-500',

                }


            default:

                return {

                    label:
                        status || 'Inconnu',

                    className:
                        'bg-slate-100 text-slate-600',

                    dot:
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


        info.textContent =
            `Affichage de ${formatNumber(from)} à ${formatNumber(to)} sur ${formatNumber(total)} administrateurs`


        const buttons = []


        buttons.push(`
            <button
                type="button"
                ${current <= 1 ? 'disabled' : ''}
                onclick="goToPage(${current - 1})"
                class="
                    h-9
                    w-9
                    rounded-lg
                    border
                    border-slate-200
                    ${
                        current <= 1
                            ? 'text-slate-300'
                            : 'text-slate-600 hover:bg-slate-50'
                    }
                "
            >
                <i class="fa-solid fa-chevron-left text-xs"></i>
            </button>
        `)


        buildPaginationPages(
            current,
            last
        )
            .forEach(
                page => {

                    if (
                        page === '...'
                    ) {

                        buttons.push(
                            `<span class="px-2 text-slate-400">...</span>`
                        )

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
                                px-2
                                text-sm
                                font-semibold
                                ${
                                    page === current
                                        ? 'bg-primary-600 text-white'
                                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
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
                    h-9
                    w-9
                    rounded-lg
                    border
                    border-slate-200
                    ${
                        current >= last
                            ? 'text-slate-300'
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


        const pages =
            [1]


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

            pages.push(
                page
            )

        }


        if (
            current <
            last - 3
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
            page >
                Number(
                    currentMeta.lastPage
                )
        ) {

            return

        }


        await loadAdministrators(
            page
        )

    }


    /*
    |--------------------------------------------------------------------------
    | DÉTAILS
    |--------------------------------------------------------------------------
    */

    async function viewAdministrator(
        id
    ) {

        try {

            const response =
                await apiRequest(
                    `/api/super-admin/administrateurs/${id}`
                )


            const result =
                await parseJson(
                    response
                )


            if (
                !response.ok ||
                !result?.success
            ) {

                throw new Error(
                    result?.message ||
                    'Impossible de récupérer les informations de cet administrateur.'
                )

            }


            renderDetails(
                result.data
            )


            openModal(
                'detailsModal'
            )

        } catch (
            error
        ) {

            showPageError(
                error.message
            )

        }

    }


    function renderDetails(
        admin
    ) {

        const fullName =
            `${admin.prenom || ''} ${admin.postnom || ''} ${admin.nom || ''}`
                .replace(
                    /\s+/g,
                    ' '
                )
                .trim()


        document
            .getElementById(
                'detailsName'
            )
            .textContent =
            fullName ||
            'Administrateur'


        document
            .getElementById(
                'detailsEmail'
            )
            .textContent =
            admin.email || '—'


        document
            .getElementById(
                'detailsPhone'
            )
            .textContent =
            admin.telephone || '—'


        document
            .getElementById(
                'detailsPseudo'
            )
            .textContent =
            admin.pseudo || '—'


        document
            .getElementById(
                'detailsCreatedAt'
            )
            .textContent =
            formatDate(
                admin.createdAt
            )


        document
            .getElementById(
                'detailsLastLogin'
            )
            .textContent =
            formatDate(
                admin.lastLoginAt
            )


        document
            .getElementById(
                'detailsStats'
            )
            .innerHTML = `

                <div class="rounded-xl bg-slate-50 p-4">
                    <p class="text-xs text-slate-400">
                        Statut
                    </p>

                    <p class="mt-1 font-semibold text-slate-700">
                        ${getStatus(admin.statut).label}
                    </p>
                </div>


                <div class="rounded-xl bg-slate-50 p-4">
                    <p class="text-xs text-slate-400">
                        Email vérifié
                    </p>

                    <p class="mt-1 font-semibold text-slate-700">
                        ${admin.isVerified ? 'Oui' : 'Non'}
                    </p>
                </div>


                <div class="rounded-xl bg-slate-50 p-4">
                    <p class="text-xs text-slate-400">
                        Écoles
                    </p>

                    <p class="mt-1 font-semibold text-slate-700">
                        ${formatNumber(
                            admin.ecoles?.length || 0
                        )}
                    </p>
                </div>

            `


        renderAdministratorSchools(
            admin
        )

    }


    function renderAdministratorSchools(
        admin
    ) {

        const container =
            document.getElementById(
                'detailsSchools'
            )


        const schools =
            admin.ecoles || []


        if (!schools.length) {

            container.innerHTML = `

                <div
                    class="
                        rounded-xl
                        bg-slate-50
                        p-4
                        text-sm
                        text-slate-400
                    "
                >
                    Aucune école associée.
                </div>

            `

            return

        }


        container.innerHTML =
            schools
                .map(
                    school => `

                        <div
                            class="
                                flex
                                flex-col
                                gap-3
                                rounded-xl
                                border
                                border-slate-200
                                p-4
                                sm:flex-row
                                sm:items-center
                                sm:justify-between
                            "
                        >

                            <div>

                                <p class="font-semibold text-slate-700">
                                    ${escapeHtml(
                                        school.nom || 'École'
                                    )}
                                </p>

                                <p class="mt-1 text-xs text-slate-400">
                                    ${escapeHtml(
                                        school.code || ''
                                    )}
                                </p>

                            </div>


                            <div
                                class="
                                    flex
                                    items-center
                                    gap-2
                                "
                            >

                                ${
                                    school.active
                                        ? `
                                            <span
                                                class="
                                                    rounded-full
                                                    bg-primary-50
                                                    px-3
                                                    py-1
                                                    text-xs
                                                    font-semibold
                                                    text-primary-700
                                                "
                                            >
                                                École active
                                            </span>
                                        `
                                        : `
                                            <button
                                                type="button"
                                                class="
                                                    rounded-lg
                                                    border
                                                    border-slate-200
                                                    px-3
                                                    py-2
                                                    text-xs
                                                    font-semibold
                                                    text-slate-600
                                                    hover:bg-slate-50
                                                "
                                                onclick="switchAdministratorSchool(${admin.id}, ${school.id})"
                                            >
                                                Définir comme active
                                            </button>
                                        `
                                }

                            </div>

                        </div>

                    `
                )
                .join('')

    }


    /*
    |--------------------------------------------------------------------------
    | MODIFIER
    |--------------------------------------------------------------------------
    */

    async function editAdministrator(
        id
    ) {

        try {

            const response =
                await apiRequest(
                    `/api/super-admin/administrateurs/${id}`
                )


            const result =
                await parseJson(
                    response
                )


            if (
                !response.ok ||
                !result?.success
            ) {

                throw new Error(
                    result?.message ||
                    'Impossible de récupérer les informations de cet administrateur.'
                )

            }


            fillEditForm(
                result.data
            )


            openModal(
                'editModal'
            )

        } catch (
            error
        ) {

            showPageError(
                error.message
            )

        }

    }


    function fillEditForm(
        admin
    ) {

        const values = {

            edit_id:
                admin.id,

            edit_prenom:
                admin.prenom,

            edit_nom:
                admin.nom,

            edit_postnom:
                admin.postnom,

            edit_pseudo:
                admin.pseudo,

            edit_email:
                admin.email,

            edit_telephone:
                admin.telephone,

            edit_sexe:
                admin.sexe,

            edit_statut:
                admin.statut,

        }


        Object.entries(
            values
        )
            .forEach(
                (
                    [
                        id,
                        value,
                    ]
                ) => {

                    document
                        .getElementById(
                            id
                        )
                        .value =
                        value ?? ''

                }
            )


        document
            .getElementById(
                'edit_password'
            )
            .value = ''


        document
            .getElementById(
                'editSubtitle'
            )
            .textContent =
            admin.email || ''

    }


    async function updateAdministrator(
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


        errorElement.classList.add(
            'hidden'
        )


        const formData =
            new FormData(
                form
            )


        const payload = {

            prenom:
                formData.get(
                    'prenom'
                ),

            nom:
                formData.get(
                    'nom'
                ),

            postnom:
                formData.get(
                    'postnom'
                ),

            pseudo:
                formData.get(
                    'pseudo'
                ),

            email:
                formData.get(
                    'email'
                ),

            telephone:
                formData.get(
                    'telephone'
                ),

            sexe:
                formData.get(
                    'sexe'
                ),

            statut:
                formData.get(
                    'statut'
                ),

        }


        const password =
            String(
                formData.get(
                    'password'
                ) || ''
            )


        if (password) {

            payload.password =
                password

        }


        const button =
            document.getElementById(
                'submitEditButton'
            )


        button.disabled =
            true


        button.textContent =
            'Enregistrement...'


        try {

            const response =
                await apiRequest(
                    `/api/super-admin/administrateurs/${id}`,
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
                await parseJson(
                    response
                )


            if (
                !response.ok ||
                !result?.success
            ) {

                throw new Error(
                    result?.message ||
                    'Impossible de modifier l’administrateur.'
                )

            }


            closeModal(
                'editModal'
            )


            showSuccess(
                result.message
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

            button.disabled =
                false

            button.textContent =
                'Enregistrer'

        }

    }


    /*
    |--------------------------------------------------------------------------
    | CRÉATION
    |--------------------------------------------------------------------------
    */

    function openCreateAdministrator() {

        document
            .getElementById(
                'createAdminForm'
            )
            .reset()


        document
            .getElementById(
                'createFormError'
            )
            .classList.add(
                'hidden'
            )


        openModal(
            'createModal'
        )

    }


async function createAdministrator(event) {

    event.preventDefault()


    const form =
        event.target


    const formData =
        new FormData(form)


    const password =
        String(
            formData.get('password') || ''
        )


    const confirmation =
        String(
            formData.get(
                'password_confirmation'
            ) || ''
        )


    const errorElement =
        document.getElementById(
            'createFormError'
        )


    /**
     * Nettoyer l'ancien message
     */
    errorElement.classList.add(
        'hidden'
    )

    errorElement.textContent =
        ''


    /**
     * Vérifier la confirmation du mot de passe
     */
    if (
        !password
    ) {

        errorElement.textContent =
            'Le mot de passe est obligatoire.'


        errorElement.classList.remove(
            'hidden'
        )

        return

    }


    if (
        password.length < 8
    ) {

        errorElement.textContent =
            'Le mot de passe doit contenir au moins 8 caractères.'


        errorElement.classList.remove(
            'hidden'
        )

        return

    }


    if (
        !confirmation
    ) {

        errorElement.textContent =
            'Veuillez confirmer le mot de passe.'


        errorElement.classList.remove(
            'hidden'
        )

        return

    }


    if (
        password !== confirmation
    ) {

        errorElement.textContent =
            'Les mots de passe ne correspondent pas.'


        errorElement.classList.remove(
            'hidden'
        )

        return

    }


    /**
     * Vérifier l'école
     */
    const ecoleId =
        Number(
            formData.get(
                'ecoleId'
            )
        )


    if (
        !ecoleId ||
        ecoleId <= 0
    ) {

        errorElement.textContent =
            'Veuillez sélectionner une école.'


        errorElement.classList.remove(
            'hidden'
        )

        return

    }


    /**
     * =========================================================================
     * PAYLOAD
     * =========================================================================
     *
     * IMPORTANT :
     * password_confirmation est envoyé ici car le validateur backend
     * l'exige.
     */
    const payload = {

        ecoleId,

        prenom:
            String(
                formData.get(
                    'prenom'
                ) || ''
            ).trim(),

        nom:
            String(
                formData.get(
                    'nom'
                ) || ''
            ).trim(),

        postnom:
            String(
                formData.get(
                    'postnom'
                ) || ''
            ).trim(),

        pseudo:
            String(
                formData.get(
                    'pseudo'
                ) || ''
            ).trim(),

        email:
            String(
                formData.get(
                    'email'
                ) || ''
            ).trim(),

        telephone:
            String(
                formData.get(
                    'telephone'
                ) || ''
            ).trim(),

        sexe:
            String(
                formData.get(
                    'sexe'
                ) || ''
            ).trim(),

        password,

        password_confirmation:
            confirmation,

    }


    /**
     * Bouton
     */
    const button =
        document.getElementById(
            'submitCreateButton'
        )


    button.disabled =
        true


    button.innerHTML =
        `
            <i class="fa-solid fa-spinner fa-spin mr-2"></i>
            Création...
        `


    try {

        const response =
            await apiRequest(
                '/api/super-admin/administrateurs',
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
            await parseJson(
                response
            )


        /**
         * =========================================================================
         * GESTION DES ERREURS BACKEND
         * =========================================================================
         */
        if (
            !response.ok ||
            !result?.success
        ) {

            let message =
                result?.message ||
                'Impossible de créer l’administrateur.'


            /**
             * Erreurs VineJS
             */
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


        /**
         * Fermeture du modal
         */
        closeModal(
            'createModal'
        )


        /**
         * Message de succès
         */
        showSuccess(
            result.message ||
            'Administrateur créé avec succès.'
        )


        /**
         * Actualiser :
         *
         * - statistiques
         * - liste
         */
        await refreshAll()


    } catch (
        error
    ) {

        console.error(
            'Création administrateur:',
            error
        )


        errorElement.textContent =
            error.message ||
            'Une erreur est survenue lors de la création.'


        errorElement.classList.remove(
            'hidden'
        )

    } finally {

        button.disabled =
            false


        button.innerHTML =
            'Créer'

    }

}


    /*
    |--------------------------------------------------------------------------
    | SUSPENDRE
    |--------------------------------------------------------------------------
    */

    function suspendAdministrator(
        id
    ) {

        const admin =
            currentAdministrators.find(
                item =>
                    Number(item.id) ===
                    Number(id)
            )


        if (!admin) {
            return
        }


        openConfirm(

            'Suspendre le compte ?',

            `Le compte de ${admin.prenom || ''} ${admin.nom || ''} sera suspendu.`,

            async () => {

                const response =
                    await apiRequest(
                        `/api/super-admin/administrateurs/${id}/suspend`,
                        {
                            method:
                                'PATCH',
                        }
                    )


                const result =
                    await parseJson(
                        response
                    )


                if (
                    !response.ok ||
                    !result?.success
                ) {

                    throw new Error(
                        result?.message ||
                        'Impossible de suspendre le compte.'
                    )

                }


                showSuccess(
                    result.message
                )


                await refreshAll()

            }

        )

    }


    /*
    |--------------------------------------------------------------------------
    | RÉACTIVER
    |--------------------------------------------------------------------------
    */

    function activateAdministrator(
        id
    ) {

        const admin =
            currentAdministrators.find(
                item =>
                    Number(item.id) ===
                    Number(id)
            )


        if (!admin) {
            return
        }


        openConfirm(

            'Réactiver le compte ?',

            `Le compte de ${admin.prenom || ''} ${admin.nom || ''} sera réactivé.`,

            async () => {

                const response =
                    await apiRequest(
                        `/api/super-admin/administrateurs/${id}/activate`,
                        {
                            method:
                                'PATCH',
                        }
                    )


                const result =
                    await parseJson(
                        response
                    )


                if (
                    !response.ok ||
                    !result?.success
                ) {

                    throw new Error(
                        result?.message ||
                        'Impossible de réactiver le compte.'
                    )

                }


                showSuccess(
                    result.message
                )


                await refreshAll()

            },

            'success'

        )

    }


    /*
    |--------------------------------------------------------------------------
    | SUPPRIMER
    |--------------------------------------------------------------------------
    */

    function deleteAdministrator(
        id
    ) {

        const admin =
            currentAdministrators.find(
                item =>
                    Number(item.id) ===
                    Number(id)
            )


        if (!admin) {
            return
        }


        openConfirm(

            'Supprimer l’administrateur ?',

            `Le compte de ${admin.prenom || ''} ${admin.nom || ''} sera désactivé et marqué comme supprimé.`,

            async () => {

                const response =
                    await apiRequest(
                        `/api/super-admin/administrateurs/${id}`,
                        {
                            method:
                                'DELETE',
                        }
                    )


                const result =
                    await parseJson(
                        response
                    )


                if (
                    !response.ok ||
                    !result?.success
                ) {

                    throw new Error(
                        result?.message ||
                        'Impossible de supprimer l’administrateur.'
                    )

                }


                showSuccess(
                    result.message
                )


                await refreshAll()

            },

            'danger'

        )

    }


    /*
    |--------------------------------------------------------------------------
    | CHANGER ÉCOLE ACTIVE
    |--------------------------------------------------------------------------
    */

    async function switchAdministratorSchool(
        userId,
        ecoleId
    ) {

        try {

            const response =
                await apiRequest(
                    `/api/super-admin/administrateurs/${userId}/active-school`,
                    {

                        method:
                            'PATCH',

                        headers: {

                            'Content-Type':
                                'application/json',

                        },

                        body:
                            JSON.stringify({
                                ecoleId:
                                    Number(
                                        ecoleId
                                    ),
                            }),

                    }
                )


            const result =
                await parseJson(
                    response
                )


            if (
                !response.ok ||
                !result?.success
            ) {

                throw new Error(
                    result?.message ||
                    'Impossible de changer l’école active.'
                )

            }


            showSuccess(
                result.message
            )


            closeModal(
                'detailsModal'
            )


            await refreshAll()

        } catch (
            error
        ) {

            showPageError(
                error.message
            )

        }

    }


    /*
    |--------------------------------------------------------------------------
    | CONFIRMATION
    |--------------------------------------------------------------------------
    */

    function openConfirm(
        title,
        message,
        callback,
        type = 'warning'
    ) {

        confirmationCallback =
            callback


        document
            .getElementById(
                'confirmTitle'
            )
            .textContent =
            title


        document
            .getElementById(
                'confirmMessage'
            )
            .textContent =
            message


        const button =
            document.getElementById(
                'confirmActionButton'
            )


        const icon =
            document.getElementById(
                'confirmIcon'
            )


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

        }


        openModal(
            'confirmModal'
        )

    }


    document
        .getElementById(
            'confirmActionButton'
        )
        .addEventListener(
            'click',
            async () => {

                try {

                    if (
                        typeof confirmationCallback ===
                        'function'
                    ) {

                        await confirmationCallback()

                    }

                } catch (
                    error
                ) {

                    showPageError(
                        error.message
                    )

                } finally {

                    closeModal(
                        'confirmModal'
                    )

                    confirmationCallback =
                        null

                }

            }
        )


    /*
    |--------------------------------------------------------------------------
    | MODALES
    |--------------------------------------------------------------------------
    */

    function openModal(
        id
    ) {

        const modal =
            document.getElementById(
                id
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


    function closeModal(
        id
    ) {

        const modal =
            document.getElementById(
                id
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
    | LOGOUT
    |--------------------------------------------------------------------------
    */

    async function logout() {

        if (
            !window.confirm(
                'Voulez-vous vraiment vous déconnecter ?'
            )
        ) {

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

        } catch (
            error
        ) {

            console.error(
                error
            )

        } finally {

            sessionStorage.clear()

            window.location.replace('/')

        }

    }


    /*
    |--------------------------------------------------------------------------
    | REFRESH
    |--------------------------------------------------------------------------
    */

    async function refreshAll() {

        await Promise.all([

            loadStatistics(),

            loadAdministrators(
                currentPage
            ),

        ])

    }


    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    let searchTimeout =
        null


    document
        .getElementById(
            'searchUser'
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

                            loadAdministrators(
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

                loadAdministrators(
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
            'schoolFilter'
        )
        .addEventListener(
            'change',
            () => {

                loadAdministrators(
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
    | SIDEBAR
    |--------------------------------------------------------------------------
    */

    document
        .getElementById(
            'menuButton'
        )
        .addEventListener(
            'click',
            () => {

                document
                    .getElementById(
                        'sidebar'
                    )
                    .classList.remove(
                        '-translate-x-full'
                    )

                document
                    .getElementById(
                        'sidebarOverlay'
                    )
                    .classList.remove(
                        'hidden'
                    )

            }
        )


    document
        .getElementById(
            'sidebarOverlay'
        )
        .addEventListener(
            'click',
            () => {

                document
                    .getElementById(
                        'sidebar'
                    )
                    .classList.add(
                        '-translate-x-full'
                    )

                document
                    .getElementById(
                        'sidebarOverlay'
                    )
                    .classList.add(
                        'hidden'
                    )

            }
        )


    /*
    |--------------------------------------------------------------------------
    | MODAL EVENTS
    |--------------------------------------------------------------------------
    */

    document
        .getElementById(
            'createAdminButton'
        )
        .addEventListener(
            'click',
            openCreateAdministrator
        )


    document
        .getElementById(
            'closeCreateModal'
        )
        .addEventListener(
            'click',
            () =>
                closeModal(
                    'createModal'
                )
        )


    document
        .getElementById(
            'cancelCreateButton'
        )
        .addEventListener(
            'click',
            () =>
                closeModal(
                    'createModal'
                )
        )


    document
        .getElementById(
            'createAdminForm'
        )
        .addEventListener(
            'submit',
            createAdministrator
        )


    document
        .getElementById(
            'closeDetailsModal'
        )
        .addEventListener(
            'click',
            () =>
                closeModal(
                    'detailsModal'
                )
        )


    document
        .getElementById(
            'closeEditModal'
        )
        .addEventListener(
            'click',
            () =>
                closeModal(
                    'editModal'
                )
        )


    document
        .getElementById(
            'cancelEditButton'
        )
        .addEventListener(
            'click',
            () =>
                closeModal(
                    'editModal'
                )
        )


    document
        .getElementById(
            'editAdminForm'
        )
        .addEventListener(
            'submit',
            updateAdministrator
        )


    document
        .getElementById(
            'cancelConfirmButton'
        )
        .addEventListener(
            'click',
            () =>
                closeModal(
                    'confirmModal'
                )
        )


    /*
    |--------------------------------------------------------------------------
    | ESC
    |--------------------------------------------------------------------------
    */

    document.addEventListener(
        'keydown',
        event => {

            if (
                event.key ===
                'Escape'
            ) {

                [
                    'createModal',
                    'detailsModal',
                    'editModal',
                    'confirmModal',
                ]
                    .forEach(
                        closeModal
                    )

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

                await loadSchools()

                await refreshAll()

            } catch (
                error
            ) {

                console.error(
                    'Initialisation utilisateurs:',
                    error
                )


                showPageError(
                    error.message ||
                    'Impossible de charger la page des utilisateurs.'
                )

            }

        }
    )