document.addEventListener('DOMContentLoaded', () => {
    initializeLogin()
})

const TOKEN_KEY = 'smart_school_access_token'
const USER_KEY = 'smart_school_user'
const SCHOOLS_KEY = 'smart_school_ecoles'
const CONTEXT_KEY = 'smart_school_context'

function initializeLogin() {
    const form = document.getElementById('loginForm')

    if (!form) {
        return
    }

    setupPasswordToggle()
    setupCapsLock()
    setupLoginForm(form)
}

function setupPasswordToggle() {
    const button = document.getElementById('togglePassword')
    const input = document.getElementById('password')
    const icon = document.getElementById('passwordIcon')

    if (!button || !input || !icon) {
        return
    }

    button.addEventListener('click', () => {
        const isPassword = input.type === 'password'

        input.type = isPassword ? 'text' : 'password'

        icon.setAttribute(
            'data-lucide',
            isPassword ? 'eye-off' : 'eye'
        )

        button.setAttribute(
            'aria-label',
            isPassword
                ? 'Masquer le mot de passe'
                : 'Afficher le mot de passe'
        )

        refreshIcons()
    })
}

function setupCapsLock() {
    const password = document.getElementById('password')
    const indicator = document.getElementById('capsIndicator')

    if (!password || !indicator) {
        return
    }

    const updateCapsLock = (event) => {
        const capsOn = event.getModifierState
            ? event.getModifierState('CapsLock')
            : false

        indicator.classList.toggle('show', capsOn)
    }

    password.addEventListener('keydown', updateCapsLock)
    password.addEventListener('keyup', updateCapsLock)
    password.addEventListener('blur', () => {
        indicator.classList.remove('show')
    })
}

function setupLoginForm(form) {
    form.addEventListener('submit', async (event) => {
        event.preventDefault()

        clearLoginErrors()

        const emailInput = document.getElementById('email')
        const passwordInput = document.getElementById('password')

        const email = emailInput?.value.trim().toLowerCase() || ''
        const password = passwordInput?.value || ''

        if (!validateEmail(email)) {
            showFieldError(
                'emailError',
                'Veuillez entrer une adresse e-mail valide.'
            )

            emailInput?.focus()

            return
        }

        if (!password) {
            showFieldError(
                'passwordError',
                'Veuillez entrer votre mot de passe.'
            )

            passwordInput?.focus()

            return
        }

        setLoadingState(true)

        try {
            const response = await fetch(
                '/api/auth/login',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },

                    body: JSON.stringify({
                        email,
                        password,
                    }),
                }
            )

            const payload = await parseJsonResponse(response)

            if (!response.ok || !payload?.success) {
                throw new Error(
                    payload?.message ||
                    'Adresse e-mail ou mot de passe incorrect.'
                )
            }

            const data = payload.data

            if (!data) {
                throw new Error(
                    'Réponse de connexion invalide.'
                )
            }

            /*
             * -------------------------------------------------------------
             * STOCKAGE DU TOKEN
             * -------------------------------------------------------------
             */
            if (data.token?.value) {
                sessionStorage.setItem(
                    TOKEN_KEY,
                    data.token.value
                )
            }

            /*
             * -------------------------------------------------------------
             * STOCKAGE UTILISATEUR
             * -------------------------------------------------------------
             */
            if (data.user) {
                sessionStorage.setItem(
                    USER_KEY,
                    JSON.stringify(data.user)
                )
            }

            /*
             * -------------------------------------------------------------
             * STOCKAGE DES ECOLES
             * -------------------------------------------------------------
             *
             * Indispensable lorsque l'utilisateur possède plusieurs écoles.
             */
            if (Array.isArray(data.ecoles)) {
                sessionStorage.setItem(
                    SCHOOLS_KEY,
                    JSON.stringify(data.ecoles)
                )
            } else {
                sessionStorage.removeItem(SCHOOLS_KEY)
            }

            /*
             * -------------------------------------------------------------
             * STOCKAGE DU CONTEXTE
             * -------------------------------------------------------------
             */
            if (data.contexte) {
                sessionStorage.setItem(
                    CONTEXT_KEY,
                    JSON.stringify(data.contexte)
                )
            } else {
                sessionStorage.removeItem(CONTEXT_KEY)
            }

            /*
             * -------------------------------------------------------------
             * REDIRECTION
             * -------------------------------------------------------------
             *
             * On utilise maintenant directement la valeur fournie
             * par AuthService.login().
             */
            const redirectTo = resolveRedirect(data)

            showLoginSuccess(
                redirectTo
            )

            /*
             * Petite pause uniquement pour laisser le message
             * "Connexion réussie" être visible.
             */
            setTimeout(() => {
                window.location.href = redirectTo
            }, 500)

        } catch (error) {
            console.error(
                'Erreur de connexion :',
                error
            )

            setLoadingState(false)

            showLoginError(
                error?.message ||
                'Une erreur est survenue pendant la connexion.'
            )
        }
    })
}

function resolveRedirect(data) {
    /*
     * Priorité 1 :
     * valeur calculée par le backend.
     */
    if (
        typeof data.redirectTo === 'string' &&
        data.redirectTo.trim() !== ''
    ) {
        return data.redirectTo
    }

    /*
     * Sécurité complémentaire côté frontend.
     */
    if (data.isSuperAdmin === true) {
        return '/super-admin/dashboard'
    }

    /*
     * Plusieurs écoles :
     * passer par le sélecteur.
     */
    if (
        data.mustChooseSchool === true &&
        Array.isArray(data.ecoles) &&
        data.ecoles.length > 1
    ) {
        return '/choisir-ecole'
    }

    /*
     * Administrateur d'école.
     */
    if (
        data.contexte?.role === 'ADMIN_ECOLE' &&
        data.contexte?.active === true
    ) {
        return '/school-admin/dashboard'
    }

    /*
     * Fallback utilisateur standard.
     */
    return '/home'
}

async function parseJsonResponse(response) {
    const contentType =
        response.headers.get('content-type') || ''

    if (
        !contentType.includes('application/json')
    ) {
        throw new Error(
            'Le serveur a retourné une réponse inattendue.'
        )
    }

    return await response.json()
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function setLoadingState(loading) {
    const button = document.getElementById(
        'loginButton'
    )

    const buttonText =
        document.getElementById(
            'loginButtonText'
        )

    const buttonIcon =
        document.getElementById(
            'loginButtonIcon'
        )

    const spinner =
        document.getElementById(
            'loginSpinner'
        )

    if (!button) {
        return
    }

    button.disabled = loading

    if (loading) {
        buttonText &&
            (buttonText.textContent =
                'Connexion...')

        buttonIcon?.classList.add('hidden')
        spinner?.classList.remove('hidden')
    } else {
        buttonText &&
            (buttonText.textContent =
                'Se connecter')

        buttonIcon?.classList.remove('hidden')
        spinner?.classList.add('hidden')
    }
}

function showLoginError(message) {
    const box =
        document.getElementById(
            'loginError'
        )

    const text =
        document.getElementById(
            'loginErrorText'
        )

    const success =
        document.getElementById(
            'loginSuccess'
        )

    if (success) {
        success.classList.add('hidden')
    }

    if (text) {
        text.textContent = message
    }

    if (box) {
        box.classList.remove('hidden')
    }
}

function showLoginSuccess() {
    const box =
        document.getElementById(
            'loginSuccess'
        )

    const error =
        document.getElementById(
            'loginError'
        )

    if (error) {
        error.classList.add('hidden')
    }

    if (box) {
        box.classList.remove('hidden')
    }
}

function showFieldError(id, message) {
    const element =
        document.getElementById(id)

    if (!element) {
        return
    }

    element.textContent = message
    element.classList.remove('hidden')
}

function clearLoginErrors() {
    const loginError =
        document.getElementById(
            'loginError'
        )

    const loginSuccess =
        document.getElementById(
            'loginSuccess'
        )

    const emailError =
        document.getElementById(
            'emailError'
        )

    const passwordError =
        document.getElementById(
            'passwordError'
        )

    loginError?.classList.add('hidden')
    loginSuccess?.classList.add('hidden')
    emailError?.classList.add('hidden')
    passwordError?.classList.add('hidden')

    if (emailError) {
        emailError.textContent = ''
    }

    if (passwordError) {
        passwordError.textContent = ''
    }
}

function refreshIcons() {
    if (
        typeof window.lucide !== 'undefined'
    ) {
        window.lucide.createIcons()
    }
}