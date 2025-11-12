//index.js
/**
 * @swagger
 *  /:
 *    get:
 *      tags:
 *      - 뉴스 빅데이터 조회
 *      description: 2020~2021 코로나 및 메타버스 뉴스 빅데이터 조회하기
 *      produces:
 *      - application/json
 *      parameters:
 *        - in: path
 *          name: category
 *          description : 1. corona 2. metabus
 *          required: false
 *          schema:
 *            type: string
 *          examples :
 *            Samples : 2007
 *            summary : A sample for MetaBus
 *        - in: path
 *          name: year
 *          description : 연도
 *          required: false
 *          schema:
 *            type: string
 *      responses:
 *       200:
 *        description: 공공데이터 조회 성공
 *       400:
 *        description: 데이터가 존재하지 않음
 */
