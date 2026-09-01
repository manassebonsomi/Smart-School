const API_TOKEN_KEY =
        'smart_school_access_token'


    const USER_KEY =
        'smart_school_user'


    /*
    |--------------------------------------------------------------------------
    | FORMAT NOMBRE
    |--------------------------------------------------------------------------
    */

    function formatNumber(value) {

        return new Intl.NumberFormat(
            'fr-FR'
        ).format(
            Number(value || 0)
        )

    }


    /*
    |--------------------------------------------------------------------------
    | AVATAR
    |--------------------------------------------------------------------------
    */

    function buildInitials(user) {

        const first =
            String(user?.prenom || '')
                .trim()
                .charAt(0)

        const last =
            String(user?.nom || '')
                .trim()
                .charAt(0)

        return (
            `${first}${last}`.toUpperCase()
            || 'SA'
        )

    }


    /*
    |--------------------------------------------------------------------------
    | AFFICHER UNE ERREUR
    |--------------------------------------------------------------------------
    */

    function showDashboardError(message) {

        const element =
            document.getElementById(
                'dashboardError'
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


    /*
    |--------------------------------------------------------------------------
    | AUTHENTIFICATION API
    |--------------------------------------------------------------------------
    */

    async function apiRequest(
        url,
        options = {}
    ) {

        const token =
            sessionStorage.getItem(
                API_TOKEN_KEY
            )


        if (!token) {

            window.location.replace('/')

            throw new Error(
                'Session absente.'
            )

        }


        const response = await fetch(
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


        if (response.status === 401) {

            sessionStorage.clear()

            window.location.replace('/')

            throw new Error(
                'Session expirée.'
            )

        }


        if (response.status === 403) {

            window.location.replace('/')

            throw new Error(
                'Accès refusé.'
            )

        }


        return response

    }


    /*
    |--------------------------------------------------------------------------
    | CHARGER L'UTILISATEUR
    |--------------------------------------------------------------------------
    */

    function loadUser() {

        const raw =
            sessionStorage.getItem(
                USER_KEY
            )


        if (!raw) {
            return null
        }


        try {

            return JSON.parse(raw)

        } catch {

            return null

        }

    }


    /*
    |--------------------------------------------------------------------------
    | AFFICHER L'UTILISATEUR
    |--------------------------------------------------------------------------
    */

    function renderUser(user) {

        if (!user) {
            return
        }


        const initials =
            buildInitials(user)


        const fullName =
            `${user.prenom || ''} ${user.nom || ''}`
                .trim()


        const displayName =
            fullName || 'Super Administrateur'


        document
            .getElementById(
                'headerAvatar'
            )
            ?.replaceChildren(
                document.createTextNode(
                    initials
                )
            )


        document
            .getElementById(
                'sidebarAvatar'
            )
            ?.replaceChildren(
                document.createTextNode(
                    initials
                )
            )


        const headerName =
            document.getElementById(
                'headerUserName'
            )


        if (headerName) {
            headerName.textContent =
                displayName
        }


        const sidebarName =
            document.getElementById(
                'sidebarUserName'
            )


        if (sidebarName) {
            sidebarName.textContent =
                displayName
        }


        const sidebarEmail =
            document.getElementById(
                'sidebarUserEmail'
            )


        if (sidebarEmail) {
            sidebarEmail.textContent =
                user.email || ''
        }


        const welcome =
            document.getElementById(
                'welcomeText'
            )


        if (welcome) {

            welcome.textContent =
                `Bonjour, ${user.prenom || 'Administrateur'} 👋`

        }

    }


    /*
    |--------------------------------------------------------------------------
    | KPI
    |--------------------------------------------------------------------------
    */

    function renderStatistics(
        statistics
    ) {

        const setText = (
            id,
            value
        ) => {

            const element =
                document.getElementById(id)

            if (element) {
                element.textContent =
                    formatNumber(value)
            }

        }


        setText(
            'totalSchools',
            statistics.totalSchools
        )


        setText(
            'totalUsers',
            statistics.totalUsers
        )


        setText(
            'totalStudents',
            statistics.totalStudents
        )


        setText(
            'activeTeachers',
            statistics.activeTeachers
        )


        setText(
            'activeUsersValue',
            statistics.activeUsers
        )


        setText(
            'activeTeachersValue',
            statistics.activeTeachers
        )


        setText(
            'activeSchoolsValue',
            statistics.activeSchools
        )


        const schoolsSubtext =
            document.getElementById(
                'schoolsSubtext'
            )


        if (schoolsSubtext) {

            schoolsSubtext.textContent =
                `${formatNumber(statistics.activeSchools)} actives • ${formatNumber(statistics.suspendedSchools)} suspendues`

        }

    }


    /*
    |--------------------------------------------------------------------------
    | DONUT UTILISATEURS
    |--------------------------------------------------------------------------
    */

    function renderUsersChart(
        users
    ) {

        const total =
            Number(users.total || 0)


        const students =
            Number(users.students || 0)

        const teachers =
            Number(users.teachers || 0)

        const parents =
            Number(users.parents || 0)

        const admins =
            Number(users.admins || 0)


        const values = [

            {
                label: 'Élèves',
                value: students,
                color: '#0ea5e9'
            },

            {
                label: 'Enseignants',
                value: teachers,
                color: '#8b5cf6'
            },

            {
                label: 'Parents',
                value: parents,
                color: '#10b981'
            },

            {
                label: 'Administrateurs',
                value: admins,
                color: '#f59e0b'
            },

        ]


        const percentages =
            values.map((item) => {

                return total > 0
                    ? (
                        item.value / total
                    ) * 100
                    : 0

            })


        let current =
            0


        const segments =
            percentages.map(
                (percentage, index) => {

                    const start =
                        current

                    current += percentage

                    return (
                        `${values[index].color} ${start}% ${current}%`
                    )

                }
            )


        const donut =
            document.getElementById(
                'usersDonut'
            )


        if (donut) {

            donut.style.background =
                `conic-gradient(${segments.join(', ')})`

        }


        const totalElement =
            document.getElementById(
                'usersDonutTotal'
            )


        if (totalElement) {

            totalElement.textContent =
                formatNumber(total)

        }


        const legend =
            document.getElementById(
                'usersLegend'
            )


        if (!legend) {
            return
        }


        legend.innerHTML =
            values
                .map((item) => {

                    const percentage =
                        total > 0
                            ? Math.round(
                                (
                                    item.value /
                                    total
                                ) * 100
                            )
                            : 0


                    return `
                        <div class="flex items-center justify-between">
                            <span class="flex items-center gap-2">
                                <span
                                    class="h-2.5 w-2.5 rounded-full"
                                    style="background:${item.color}"
                                ></span>

                                ${item.label}
                            </span>

                            <strong>
                                ${percentage}%
                            </strong>
                        </div>
                    `

                })
                .join('')

    }


    /*
    |--------------------------------------------------------------------------
    | GRAPHIQUE ECOLES
    |--------------------------------------------------------------------------
    */

    function renderSchoolsChart(
        monthlySchools
    ) {

        const values =
            monthlySchools.map(
                item =>
                    Number(item.total || 0)
            )


        const maximum =
            Math.max(
                ...values,
                1
            )


        const points =
            monthlySchools.map(
                (item, index) => {

                    const x =
                        40 +
                        (
                            index *
                            (
                                720 /
                                Math.max(
                                    monthlySchools.length - 1,
                                    1
                                )
                            )
                        )


                    const normalized =
                        Number(item.total || 0) /
                        maximum


                    const y =
                        220 -
                        (
                            normalized *
                            170
                        )


                    return {
                        x,
                        y,
                        value:
                            Number(item.total || 0)
                    }

                }
            )


        const polyline =
            points
                .map(
                    point =>
                        `${point.x},${point.y}`
                )
                .join(' ')


        const line =
            document.getElementById(
                'schoolsChartLine'
            )


        if (line) {

            line.setAttribute(
                'points',
                polyline
            )

        }


        const pointsGroup =
            document.getElementById(
                'schoolsChartPoints'
            )


        if (pointsGroup) {

            pointsGroup.innerHTML =
                points
                    .map(
                        point => `

                            <circle
                                cx="${point.x}"
                                cy="${point.y}"
                                r="5"
                                fill="#0ea5e9"
                            >
                                <title>
                                    ${point.value} école(s)
                                </title>
                            </circle>

                        `
                    )
                    .join('')

        }


        const yearElement =
            document.getElementById(
                'chartYear'
            )


        if (yearElement) {

            yearElement.textContent =
                new Date().getFullYear()

        }

    }


    /*
    |--------------------------------------------------------------------------
    | ECOLES RECENTES
    |--------------------------------------------------------------------------
    */

    function renderRecentSchools(
        schools
    ) {

        const tbody =
            document.getElementById(
                'schoolsTableBody'
            )


        if (!tbody) {
            return
        }


        if (!schools.length) {

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        class="
                            px-6
                            py-10
                            text-center
                            text-slate-400
                        "
                    >
                        Aucune école enregistrée.
                    </td>

                </tr>

            `

            return

        }


        tbody.innerHTML =
            schools
                .map((school) => {

                    const status =
                        String(
                            school.statut || ''
                        ).toUpperCase()


                    let badgeClass =
                        'bg-slate-100 text-slate-600'


                    let label =
                        school.statut || 'Inconnu'


                    if (status === 'ACTIF') {

                        badgeClass =
                            'bg-emerald-50 text-emerald-600'

                        label =
                            'Active'

                    } else if (
                        status === 'SUSPENDU'
                    ) {

                        badgeClass =
                            'bg-red-50 text-red-600'

                        label =
                            'Suspendue'

                    } else if (
                        status === 'ARCHIVE'
                    ) {

                        badgeClass =
                            'bg-amber-50 text-amber-600'

                        label =
                            'Archivée'

                    }


                    return `

                        <tr class="hover:bg-slate-50">

                            <td class="px-6 py-4">

                                <div>

                                    <p class="font-semibold">
                                        ${school.nom || '—'}
                                    </p>

                                    <p class="text-xs text-slate-400">
                                        ${school.code || ''}
                                    </p>

                                </div>

                            </td>


                            <td class="px-6 py-4 text-slate-500">
                                ${school.adresse || '—'}
                            </td>


                            <td class="px-6 py-4">
                                ${formatNumber(school.nombreAdministrateurs)}
                            </td>


                            <td class="px-6 py-4">
                                ${formatNumber(school.nombreUtilisateurs)}
                            </td>


                            <td class="px-6 py-4">
                                ${formatNumber(school.nombreEleves)}
                            </td>


                            <td class="px-6 py-4">

                                <span
                                    class="
                                        rounded-full
                                        px-3
                                        py-1
                                        text-xs
                                        font-semibold
                                        ${badgeClass}
                                    "
                                >
                                    ${label}
                                </span>

                            </td>

                        </tr>

                    `

                })
                .join('')

    }


    /*
    |--------------------------------------------------------------------------
    | SYSTEM HEALTH
    |--------------------------------------------------------------------------
    */

    function renderSystemHealth(
        health
    ) {

        const status =
            document.getElementById(
                'systemStatus'
            )


        const dot =
            document.getElementById(
                'systemStatusDot'
            )


        const database =
            document.getElementById(
                'databaseStatus'
            )


        const responseTime =
            document.getElementById(
                'responseTime'
            )


        const healthy =
            health.status === 'healthy'


        if (status) {

            status.textContent =
                healthy
                    ? 'Système opérationnel'
                    : 'Système dégradé'

        }


        if (dot) {

            dot.className =
                healthy
                    ? 'h-2.5 w-2.5 rounded-full bg-emerald-500'
                    : 'h-2.5 w-2.5 rounded-full bg-red-500'

        }


        if (database) {

            database.textContent =
                health.database === 'ok'
                    ? 'Connectée'
                    : 'Erreur'

        }


        if (responseTime) {

            responseTime.textContent =
                `${health.responseTimeMs} ms`

        }

    }

    /*
    |--------------------------------------------------------------------------
    | CHARGEMENT DASHBOARD
    |--------------------------------------------------------------------------
    */

    async function loadDashboard() {

        const response =
            await apiRequest(
                '/api/super-admin/dashboard'
            )


        if (!response.ok) {

            const data =
                await response
                    .json()
                    .catch(
                        () => null
                    )


            throw new Error(
                data?.message ||
                'Impossible de charger le dashboard.'
            )

        }


        const result =
            await response.json()


        if (
            !result.success ||
            !result.data
        ) {

            throw new Error(
                'Réponse dashboard invalide.'
            )

        }


        const data =
            result.data


        renderStatistics(
            data.statistics
        )


        renderUsersChart(
            data.usersByRole
        )


        renderSchoolsChart(
            data.monthlySchools
        )


        renderRecentSchools(
            data.recentSchools
        )


        renderSystemHealth(
            data.systemHealth
        )

    }


    /*
    |--------------------------------------------------------------------------
    | DATE
    |--------------------------------------------------------------------------
    */

    function renderDate() {

        const element =
            document.getElementById(
                'dashboardDate'
            )


        if (!element) {
            return
        }


        const date =
            new Intl.DateTimeFormat(
                'fr-FR',
                {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                }
            )
            .format(
                new Date()
            )


        element.textContent =
            date.charAt(0).toUpperCase() +
            date.slice(1)

    }


    /*
    |--------------------------------------------------------------------------
    | INITIALISATION
    |--------------------------------------------------------------------------
    */

    document.addEventListener(
        'DOMContentLoaded',
        async () => {

            if (window.lucide) {

                window.lucide.createIcons()

            }


            renderDate()


            /*
             * Mobile sidebar
             */
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


            /*
             * Utilisateur local
             */
            const user =
                loadUser()


            renderUser(user)


            /*
             * Dashboard API
             */
            try {

                await loadDashboard()

            } catch (error) {

                console.error(
                    'Dashboard loading error:',
                    error
                )


                showDashboardError(
                    error.message ||
                    'Impossible de charger les données du tableau de bord.'
                )

            }

        }
    )
