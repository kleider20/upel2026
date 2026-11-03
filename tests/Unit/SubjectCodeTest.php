<?php

use App\Support\SubjectCode;

test('builds the base with the initials of the significant words', function (string $name, string $base) {
    expect(SubjectCode::generate($name, 1, 'presencial'))
        ->toBe("{$base}-PA1PRE");
})->with([
    ['Desarrollo Socio Afectivo y Sexualidad', 'DSAS'],
    ['Desarrollo de Procesos Cognitivos', 'DPC'],
    ['Investigación I', 'II'],
    ['Fundamentos de la Educación Primaria', 'FEP'],
]);

test('appends the period and the online modality', function () {
    expect(SubjectCode::generate('Desarrollo Socio Afectivo y Sexualidad', 1, 'online'))
        ->toBe('DSAS-PA1ONLINE');
});

test('changes the generated code with the period', function () {
    expect(SubjectCode::generate('Desarrollo Socio Afectivo y Sexualidad', 3, 'presencial'))
        ->toBe('DSAS-PA3PRE');
});

test('appends the modality suffix', function (string $modality, string $suffix) {
    expect(SubjectCode::generate('Desarrollo Socio Afectivo y Sexualidad', 1, $modality))
        ->toBe("DSAS-PA1{$suffix}");
})->with([
    ['online', 'ONLINE'],
    ['presencial', 'PRE'],
    ['mixta', 'SEMI'],
]);

test('ignores connectors and accents', function () {
    expect(SubjectCode::generate('Fundamentos de la Educación Primaria', 3, 'online'))
        ->toBe('FEP-PA3ONLINE');
});

test('converts numeric words to roman numerals', function () {
    expect(SubjectCode::generate('Matemática 4', 1, 'online'))
        ->toBe('MIV-PA1ONLINE');
});

test('returns only the name portion before a period is selected', function () {
    expect(SubjectCode::generate('Aprendizaje Matemático 1'))
        ->toBe('AMI');
});

test('marks elective subjects with the UNCLE suffix', function () {
    expect(SubjectCode::generate('Desarrollo Socio Afectivo y Sexualidad', 2, 'online', 'UNCLE'))
        ->toBe('DSAS-PA2ONLINEUNCLE');
});

test('does not add a suffix for obligatory subjects', function () {
    expect(SubjectCode::generate('Desarrollo Socio Afectivo y Sexualidad', 2, 'online', 'UNCO'))
        ->toBe('DSAS-PA2ONLINE');
});

test('returns an empty code when the name has no significant words', function () {
    expect(SubjectCode::generate('de la', 1, 'presencial'))->toBe('');
});
