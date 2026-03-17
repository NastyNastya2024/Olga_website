/**
 * Правовая информация и согласие на обработку данных в футере
 */
(function() {
    const LEGAL_HTML = `
        <div id="legalInfoModal" class="legal-info-modal" style="display: none;">
            <div class="legal-info-overlay" onclick="closeLegalInfo()"></div>
            <div class="legal-info-content">
                <button class="legal-info-close" onclick="closeLegalInfo()" aria-label="Закрыть">&times;</button>
                <h3 class="legal-info-title">Реквизиты для пополнения счёта</h3>
                <dl class="legal-info-list">
                    <dt>Контрагент</dt>
                    <dd>ИП АЛЕКСЕЕВА ОЛЬГА ВИКТОРОВНА</dd>
                    <dt>Юридический адрес</dt>
                    <dd>354383, РОССИЯ, КРАСНОДАРСКИЙ КРАЙ, пгт Сириус Марсовый 26/1</dd>
                    <dt>ИНН</dt>
                    <dd>380411505600</dd>
                    <dt>ОГРН</dt>
                    <dd>323237500136460</dd>
                    <dt>Телефон</dt>
                    <dd><a href="tel:89025796252" class="legal-info-link-inner">8 902 579-62-52</a></dd>
                    <dt>Email</dt>
                    <dd><a href="mailto:ola_br@mail.ru" class="legal-info-link-inner">ola_br@mail.ru</a></dd>
                </dl>
            </div>
        </div>
    `;

    const CONSENT_HTML = `
        <div id="consentDataModal" class="consent-data-modal" style="display: none;">
            <div class="consent-data-overlay" onclick="closeConsentData()"></div>
            <div class="consent-data-content">
                <button class="consent-data-close" onclick="closeConsentData()" aria-label="Закрыть">&times;</button>
                <h3 class="consent-data-title">Согласие на обработку персональных данных</h3>
                <div class="consent-data-text">
                    <p>Я даю согласие ИП АЛЕКСЕЕВА О.В. (далее — Оператор) на обработку моих персональных данных, указанных при заполнении форм на сайте, в целях предоставления услуг, связи с пользователем, рассылки информации о занятиях и мероприятиях.</p>
                    <p>Обработка персональных данных осуществляется в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных».</p>
                    <p>Перечень персональных данных: фамилия, имя, отчество (при наличии), адрес электронной почты, номер телефона (при наличии).</p>
                    <p>Способы обработки: сбор, запись, систематизация, накопление, хранение, уточнение (обновление, изменение), извлечение, использование, передача (предоставление, доступ), блокирование, удаление, уничтожение.</p>
                    <p>Срок действия согласия: до момента его отзыва путём направления письменного заявления Оператору на электронную почту ola_br@mail.ru.</p>
                    <p>Я уведомлен(а), что могу отозвать согласие в любой момент, направив соответствующее заявление на электронную почту Оператора.</p>
                </div>
                <button type="button" class="consent-data-btn" onclick="closeConsentData()">Закрыть</button>
            </div>
        </div>
    `;

    function init() {
        document.body.insertAdjacentHTML('beforeend', LEGAL_HTML);
        document.body.insertAdjacentHTML('beforeend', CONSENT_HTML);

        const footerText = document.querySelector('.footer .footer-text');
        if (footerText) {
            footerText.insertAdjacentHTML('afterend', ' <span class="legal-info-footer"><a href="#" class="legal-info-link" onclick="openLegalInfo(event)">Правовая информация</a></span> <span class="legal-info-footer"><a href="#" class="legal-info-link" onclick="openConsentData(event)">Согласие на обработку данных</a></span>');
        }
    }

    window.openLegalInfo = function(e) {
        if (e) e.preventDefault();
        const modal = document.getElementById('legalInfoModal');
        if (modal) modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };

    window.closeLegalInfo = function() {
        const modal = document.getElementById('legalInfoModal');
        if (modal) modal.style.display = 'none';
        document.body.style.overflow = '';
    };

    window.openConsentData = function(e) {
        if (e) e.preventDefault();
        const modal = document.getElementById('consentDataModal');
        if (modal) modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };

    window.closeConsentData = function() {
        const modal = document.getElementById('consentDataModal');
        if (modal) modal.style.display = 'none';
        document.body.style.overflow = '';
    };

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const legalModal = document.getElementById('legalInfoModal');
            const consentModal = document.getElementById('consentDataModal');
            if (legalModal && legalModal.style.display === 'flex') closeLegalInfo();
            if (consentModal && consentModal.style.display === 'flex') closeConsentData();
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
