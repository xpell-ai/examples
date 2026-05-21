export const view =
{
  "_type": "view",
  "_id": "ttt-home",
  "class": "ttt-home",

  "_children": [

    {
      "_type": "label",
      "_id": "ttt-title",
      "_text": "Xpell 2 Tic Tac Toe"
    },

    {
      "_type": "view",
      "_id": "ttt-board",

      "_children": [

        {
          "_type": "view",
          "_id": "row-0",

          "_children": [

            {
              "_type": "button",
              "_id": "cell-0-0",

              "_data_source": "ttt:cell:0:0",

              "_on_data": [
                {
                  "_op": "set-field",
                  "_params": {
                    "name": "_text",
                    "value": "$data"
                  }
                }
              ],

              "_on": {
                "click": [
                  {
                    "_op": "req",
                    "_module": "ttt",
                    "_params": {
                      "_row": 0,
                      "_col": 0
                    }
                  }
                ]
              }
            },

            {
              "_type": "button",
              "_id": "cell-0-1",

              "_data_source": "ttt:cell:0:1",

              "_on_data": [
                {
                  "_op": "set-field",
                  "_params": {
                    "name": "_text",
                    "value": "$data"
                  }
                }
              ],

              "_on": {
                "click": [
                  {
                    "_op": "req",
                    "_module": "ttt",
                    "_params": {
                      "_row": 0,
                      "_col": 1
                    }
                  }
                ]
              }
            }

          ]
        }
      ]
    },

    {
      "_type": "label",

      "_id": "ttt-status",

      "_data_source": "ttt:status",

      "_on_data": [
        {
          "_op": "set-field",
          "_params": {
            "name": "_text",
            "value": "$data"
          }
        }
      ]
    },

    {
      "_type": "button",

      "_id": "ttt-reset",

      "_text": "New Game",

      "_on": {
        "click": [
          {
            "_module": "ttt",
            "_op": "reset"
          }
        ]
      }
    }
  ]
}