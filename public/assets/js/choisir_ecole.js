        const TOKEN_KEY =
            'smart_school_access_token'

        const USER_KEY =
            'smart_school_user'


        let currentUser =
            null

        let schools =
            []


        /*
        |--------------------------------------------------------------------------
        | DOM
        |--------------------------------------------------------------------------
        */

        const loadingState =
            document.getElementById(
                'loadingState'
            )

        const emptyState =
            document.getElementById(
                'emptyState'
            )

        const schoolsSection =
            document.getElementById(
                'schoolsSection'
            )

        const schoolsGrid =
            document.getElementById(
                'schoolsGrid'
            )

        const pageError =
            document.getElementById(
                'pageError'
            )

        const pageErrorMessage =
            document.getElementById(
                'pageErrorMessage'
            )


        /*
        |--------------------------------------------------------------------------
        | TOKEN
        |--------------------------------------------------------------------------
        */

        function getToken() {

            return sessionStorage.getItem(
                TOKEN_KEY
            )

        }


        /*
        |--------------------------------------------------------------------------
        | UTILITAIRES
        |--------------------------------------------------------------------------
        */

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


        function getFullName(
            user
        ) {

            return (
                `${user?.prenom || ''} ${user?.postnom || ''} ${user?.nom || ''}`
                    .replace(/\s+/g, ' ')
                    .trim()
            )

        }


        function getInitials(
            user
        ) {

            const initials =
                `${user?.prenom || ''}${user?.nom || ''}`
                    .replace(/\s+/g, '')
                    .slice(0, 2)
                    .toUpperCase()

            return initials || 'SS'

        }


        function normalizeRole(
            role
        ) {

            return String(
                role || ''
            )
                .trim()
                .toUpperCase()

        }


        function roleLabel(
            role
        ) {

            switch (
                normalizeRole(role)
            ) {

                case 'ADMIN_ECOLE':
                    return 'Administrateur de l’école'

                case 'ENSEIGNANT':
                case 'TEACHER':
                    return 'Enseignant'

                case 'PARENT':
                    return 'Parent'

                case 'ELEVE':
                case 'STUDENT':
                    return 'Élève'

                case 'USER':
                    return 'Utilisateur'

                default:
                    return role || 'Utilisateur'

            }

        }


        function roleIcon(
            role
        ) {

            switch (
                normalizeRole(role)
            ) {

                case 'ADMIN_ECOLE':
                    return 'fa-user-shield'

                case 'ENSEIGNANT':
                case 'TEACHER':
                    return 'fa-chalkboard-user'

                case 'PARENT':
                    return 'fa-user-group'

                case 'ELEVE':
                case 'STUDENT':
                    return 'fa-user-graduate'

                default:
                    return 'fa-user'

            }

        }


        function redirectAfterSwitch(
            role
        ) {

            switch (
                normalizeRole(role)
            ) {

                case 'ADMIN_ECOLE':
                    return '/school-admin/dashboard'

                case 'ENSEIGNANT':
                case 'TEACHER':
                    return '/teacher/dashboard'

                case 'PARENT':
                    return '/parent/dashboard'

                case 'ELEVE':
                case 'STUDENT':
                    return '/student/dashboard'

                default:
                    return '/home'

            }

        }


        /*
        |--------------------------------------------------------------------------
        | UI
        |--------------------------------------------------------------------------
        */

        function showError(
            message
        ) {

            if (
                pageErrorMessage
            ) {

                pageErrorMessage.textContent =
                    message ||
                    'Une erreur est survenue.'

            }

            pageError?.classList.remove(
                'hidden'
            )

        }


        function hideError() {

            pageError?.classList.add(
                'hidden'
            )

        }


        function showLoading() {

            loadingState?.classList.remove(
                'hidden'
            )

            emptyState?.classList.add(
                'hidden'
            )

            schoolsSection?.classList.add(
                'hidden'
            )

        }


        function showEmpty() {

            loadingState?.classList.add(
                'hidden'
            )

            emptyState?.classList.remove(
                'hidden'
            )

            schoolsSection?.classList.add(
                'hidden'
            )

        }


        function showSchools() {

            loadingState?.classList.add(
                'hidden'
            )

            emptyState?.classList.add(
                'hidden'
            )

            schoolsSection?.classList.remove(
                'hidden'
            )

        }


        /*
        |--------------------------------------------------------------------------
        | HEADER USER
        |--------------------------------------------------------------------------
        */

        function renderCurrentUser() {

            if (!currentUser) {
                return
            }

            const fullName =
                getFullName(
                    currentUser
                )

            const initials =
                getInitials(
                    currentUser
                )

            const headerUserName =
                document.getElementById(
                    'headerUserName'
                )

            const headerUserEmail =
                document.getElementById(
                    'headerUserEmail'
                )

            const headerAvatar =
                document.getElementById(
                    'headerAvatar'
                )

            if (headerUserName) {

                headerUserName.textContent =
                    fullName ||
                    'Utilisateur'

            }

            if (headerUserEmail) {

                headerUserEmail.textContent =
                    currentUser.email ||
                    ''

            }

            if (headerAvatar) {

                headerAvatar.textContent =
                    initials

            }

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
    response.status === 401
) {
    let errorMessage =
        'La session API a été refusée.'

    try {
        const errorData =
            await response.clone().json()

        errorMessage =
            errorData?.message ||
            errorMessage
    } catch {
        // La réponse n'est pas JSON.
    }

    console.error(
        'API 401:',
        url,
        errorMessage
    )

    throw new Error(
        errorMessage
    )
}


            return response

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
        | CHARGER L'UTILISATEUR ET LES ÉCOLES
        |--------------------------------------------------------------------------
        */

        async function loadData() {

            showLoading()

            hideError()

            try {

                const response =
                    await apiRequest(
                        '/api/auth/me'
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
                        'Impossible de récupérer vos informations.'
                    )

                }


                const data =
                    result.data || {}


                currentUser =
                    data.user ||
                    null


                schools =
                    Array.isArray(
                        data.ecoles
                    )
                        ? data.ecoles
                        : []


                /*
                |--------------------------------------------------------------------------
                | SAUVEGARDE UTILISATEUR
                |--------------------------------------------------------------------------
                */

                if (currentUser) {

                    sessionStorage.setItem(
                        USER_KEY,
                        JSON.stringify(
                            currentUser
                        )
                    )

                }


                renderCurrentUser()


                /*
                |--------------------------------------------------------------------------
                | ÉCOLES
                |--------------------------------------------------------------------------
                */

                if (!schools.length) {

                    showEmpty()

                    return

                }


                renderSchools(
                    schools
                )

                showSchools()

            } catch (
                error
            ) {

                console.error(
                    'Choix école:',
                    error
                )

                showError(
                    error?.message ||
                    'Impossible de charger les écoles associées à votre compte.'
                )

                loadingState?.classList.add(
                    'hidden'
                )

            }

        }


        /*
        |--------------------------------------------------------------------------
        | RENDU DES ÉCOLES
        |--------------------------------------------------------------------------
        */

        function renderSchools(
            items
        ) {

            if (!schoolsGrid) {
                return
            }


            schoolsGrid.innerHTML =
                items
                    .map(
                        school => {

                            const role =
                                normalizeRole(
                                    school.role
                                )

                            const isActive =
                                Boolean(
                                    school.active
                                )


                            return `
                                <button
                                    type="button"
                                    class="
                                        school-card
                                        group
                                        fade-in
                                        w-full
                                        rounded-3xl
                                        border
                                        bg-white
                                        p-5
                                        text-left
                                        shadow-sm
                                        ${
                                            isActive
                                                ? 'active border-blue-300'
                                                : 'border-slate-200'
                                        }
                                    "
                                    data-school-id="${Number(school.id)}"
                                    data-role="${escapeHtml(role)}"
                                >

                                    <div
                                        class="
                                            flex
                                            items-start
                                            justify-between
                                            gap-4
                                        "
                                    >

                                        <div
                                            class="
                                                flex
                                                h-14
                                                w-14
                                                shrink-0
                                                items-center
                                                justify-center
                                                rounded-2xl
                                                ${
                                                    isActive
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-blue-50 text-blue-600'
                                                }
                                            "
                                        >
                                            <i
                                                class="fa-solid fa-school text-xl"
                                            ></i>
                                        </div>


                                        ${
                                            isActive
                                                ? `
                                                    <span
                                                        class="
                                                            inline-flex
                                                            items-center
                                                            gap-1.5
                                                            rounded-full
                                                            bg-emerald-50
                                                            px-2.5
                                                            py-1.5
                                                            text-[10px]
                                                            font-bold
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
                                                        École active
                                                    </span>
                                                `
                                                : ''
                                        }

                                    </div>


                                    <div class="mt-5">

                                        <h2
                                            class="
                                                text-lg
                                                font-bold
                                                leading-6
                                                text-slate-800
                                            "
                                        >
                                            ${escapeHtml(
                                                school.nom ||
                                                'École sans nom'
                                            )}
                                        </h2>


                                        <div
                                            class="
                                                mt-3
                                                flex
                                                flex-wrap
                                                gap-2
                                            "
                                        >

                                            ${
                                                school.code
                                                    ? `
                                                        <span
                                                            class="
                                                                inline-flex
                                                                items-center
                                                                gap-1.5
                                                                rounded-full
                                                                border
                                                                border-slate-200
                                                                bg-slate-50
                                                                px-2.5
                                                                py-1.5
                                                                text-[10px]
                                                                font-semibold
                                                                text-slate-600
                                                            "
                                                        >
                                                            <i
                                                                class="fa-solid fa-hashtag text-[9px]"
                                                            ></i>

                                                            ${escapeHtml(
                                                                school.code
                                                            )}
                                                        </span>
                                                    `
                                                    : ''
                                            }


                                            ${
                                                school.ville
                                                    ? `
                                                        <span
                                                            class="
                                                                inline-flex
                                                                items-center
                                                                gap-1.5
                                                                rounded-full
                                                                border
                                                                border-slate-200
                                                                bg-slate-50
                                                                px-2.5
                                                                py-1.5
                                                                text-[10px]
                                                                font-semibold
                                                                text-slate-600
                                                            "
                                                        >
                                                            <i
                                                                class="fa-solid fa-location-dot text-[9px]"
                                                            ></i>

                                                            ${escapeHtml(
                                                                school.ville
                                                            )}
                                                        </span>
                                                    `
                                                    : ''
                                            }

                                        </div>


                                        <div
                                            class="
                                                mt-5
                                                rounded-2xl
                                                border
                                                border-slate-100
                                                bg-slate-50
                                                px-4
                                                py-3
                                            "
                                        >

                                            <div
                                                class="
                                                    flex
                                                    items-center
                                                    gap-2
                                                "
                                            >

                                                <span
                                                    class="
                                                        flex
                                                        h-8
                                                        w-8
                                                        items-center
                                                        justify-center
                                                        rounded-lg
                                                        bg-white
                                                        text-slate-500
                                                        shadow-sm
                                                    "
                                                >
                                                    <i
                                                        class="
                                                            fa-solid
                                                            ${roleIcon(role)}
                                                            text-xs
                                                        "
                                                    ></i>
                                                </span>

                                                <div>

                                                    <p
                                                        class="
                                                            text-[10px]
                                                            font-medium
                                                            uppercase
                                                            tracking-wide
                                                            text-slate-400
                                                        "
                                                    >
                                                        Votre rôle
                                                    </p>

                                                    <p
                                                        class="
                                                            text-xs
                                                            font-semibold
                                                            text-slate-700
                                                        "
                                                    >
                                                        ${escapeHtml(
                                                            roleLabel(
                                                                role
                                                            )
                                                        )}
                                                    </p>

                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    <div
                                        class="
                                            mt-5
                                            flex
                                            items-center
                                            justify-between
                                            border-t
                                            border-slate-100
                                            pt-4
                                        "
                                    >

                                        <span
                                            class="
                                                text-xs
                                                font-medium
                                                text-slate-400
                                            "
                                        >
                                            ${
                                                isActive
                                                    ? 'Contexte actuel'
                                                    : 'Sélectionner cette école'
                                            }
                                        </span>


                                        <span
                                            class="
                                                flex
                                                h-9
                                                w-9
                                                items-center
                                                justify-center
                                                rounded-xl
                                                ${
                                                    isActive
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600'
                                                }
                                            "
                                        >
                                            <i
                                                class="
                                                    fa-solid
                                                    ${
                                                        isActive
                                                            ? 'fa-check'
                                                            : 'fa-arrow-right'
                                                    }
                                                    text-xs
                                                "
                                            ></i>
                                        </span>

                                    </div>

                                </button>
                            `

                        }
                    )
                    .join('')


            schoolsGrid
                .querySelectorAll(
                    '[data-school-id]'
                )
                .forEach(
                    button => {

                        button.addEventListener(
                            'click',
                            () => {

                                const schoolId =
                                    Number(
                                        button.dataset.schoolId
                                    )

                                selectSchool(
                                    schoolId,
                                    button
                                )

                            }
                        )

                    }
                )

        }


        /*
        |--------------------------------------------------------------------------
        | SÉLECTION D'UNE ÉCOLE
        |--------------------------------------------------------------------------
        */

        async function selectSchool(
            ecoleId,
            button
        ) {

            if (
                !Number.isInteger(
                    ecoleId
                ) ||
                ecoleId <= 0
            ) {

                return

            }


            hideError()


            const allButtons =
                schoolsGrid
                    ?.querySelectorAll(
                        '[data-school-id]'
                    ) ||
                    []


            allButtons.forEach(
                item => {

                    item.classList.add(
                        'is-loading'
                    )

                    const arrow =
                        item.querySelector(
                            '[data-school-arrow]'
                        )

                }
            )


            if (button) {

                const footer =
                    button.querySelector(
                        '.border-t'
                    )

                if (footer) {

                    const statusText =
                        footer.querySelector(
                            'span:first-child'
                        )

                    if (statusText) {

                        statusText.textContent =
                            'Sélection de l’école...'

                    }

                }


                const icon =
                    button.querySelector(
                        '.fa-arrow-right'
                    )

                if (icon) {

                    icon.className =
                        'fa-solid fa-spinner spinner text-xs'

                }

            }

            const token =
    getToken()

console.log(
    'Token présent avant switch:',
    Boolean(token)
)

console.log(
    'École sélectionnée:',
    ecoleId
)

            try {

                console.log(
    'Envoi PATCH /api/auth/switch-school',
    {
        ecoleId
    }
)

                const response =
                    await apiRequest(
                        '/api/auth/switch-school',
                        {
                            method:
                                'PATCH',

                            headers: {
                                'Content-Type':
                                    'application/json',
                            },

                            body:
                                JSON.stringify({
                                    ecoleId,
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
                        'Impossible de sélectionner cette école.'
                    )

                }


                /*
                |--------------------------------------------------------------------------
                | MISE À JOUR DU CONTEXTE
                |--------------------------------------------------------------------------
                */

                const context =
                    result.context ||
                    result.data?.context ||
                    null


                let selectedSchool =
                    schools.find(
                        school =>
                            Number(
                                school.id
                            ) ===
                            Number(
                                ecoleId
                            )
                    ) ||
                    null


                const selectedRole =
                    context?.role ||
                    selectedSchool?.role ||
                    'USER'


                /*
                |--------------------------------------------------------------------------
                | MISE À JOUR SESSION
                |--------------------------------------------------------------------------
                */

                const storedUser =
                    sessionStorage.getItem(
                        USER_KEY
                    )


                if (storedUser) {

                    try {

                        const user =
                            JSON.parse(
                                storedUser
                            )

                        user.activeSchoolId =
                            Number(
                                ecoleId
                            )

                        user.activeSchoolRole =
                            selectedRole

                        sessionStorage.setItem(
                            USER_KEY,
                            JSON.stringify(
                                user
                            )
                        )

                    } catch {

                        // Ignore une ancienne donnée invalide.

                    }

                }


                /*
                |--------------------------------------------------------------------------
                | REDIRECTION
                |--------------------------------------------------------------------------
                */

                window.location.replace(
                    redirectAfterSwitch(
                        selectedRole
                    )
                )

            } catch (
                error
            ) {

                console.error(
                    'Switch school:',
                    error
                )

                showError(
                    error?.message ||
                    'Impossible de sélectionner cette école.'
                )

                allButtons.forEach(
                    item => {

                        item.classList.remove(
                            'is-loading'
                        )

                    }
                )


                if (button) {

                    const footer =
                        button.querySelector(
                            '.border-t'
                        )

                    if (footer) {

                        const statusText =
                            footer.querySelector(
                                'span:first-child'
                            )

                        if (statusText) {

                            statusText.textContent =
                                'Sélectionner cette école'

                        }

                    }

                }

            }

        }


        /*
        |--------------------------------------------------------------------------
        | DÉCONNEXION
        |--------------------------------------------------------------------------
        */

        async function logout() {

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

            } catch {

                // La session locale sera tout de même supprimée.

            } finally {

                sessionStorage.removeItem(
                    TOKEN_KEY
                )

                sessionStorage.removeItem(
                    USER_KEY
                )

                window.location.replace(
                    '/'
                )

            }

        }


        /*
        |--------------------------------------------------------------------------
        | EVENTS
        |--------------------------------------------------------------------------
        */

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
                'emptyLogoutButton'
            )
            ?.addEventListener(
                'click',
                logout
            )


        /*
        |--------------------------------------------------------------------------
        | INITIALISATION
        |--------------------------------------------------------------------------
        */

        document.addEventListener(
            'DOMContentLoaded',
            () => {

                loadData()

            }
        )
