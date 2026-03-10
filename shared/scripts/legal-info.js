/**
 * Правовая информация в футере — ссылка и попап с реквизитами
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

    function init() {
        document.body.insertAdjacentHTML('beforeend', LEGAL_HTML);

        const footerText = document.querySelector('.footer .footer-text');
        if (footerText) {
            footerText.insertAdjacentHTML('afterend', ' <span class="legal-info-footer"><a href="#" class="legal-info-link" onclick="openLegalInfo(event)">Правовая информация</a></span>');
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

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('legalInfoModal');
            if (modal && modal.style.display === 'flex') closeLegalInfo();
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
