package dev.web.api.bm_a031;

import java.util.ArrayList;
import java.util.List;

import lombok.Data;

/**
 * CSV アップロードの結果
 *
 * <p>1 行でもエラーがあれば、どの行も DB に反映しない（errors に全エラーを入れて返す）。</p>
 *
 * @author shiraishitoshio
 */
@Data
public class CsvUploadResponse {

	/** 対象マスタ（season / team / future） */
	private String masterName;

	/** メッセージ */
	private String message;

	/** CSV の行数（ヘッダー・空行を除く） */
	private int totalCount;

	/** 登録件数 */
	private int insertCount;

	/** 更新件数 */
	private int updateCount;

	/** 削除件数 */
	private int deleteCount;

	/** 非表示件数 */
	private int hideCount;

	/** 再表示件数 */
	private int showCount;

	/** 行エラー */
	private List<CsvUploadRowError> errors = new ArrayList<>();

	public CsvUploadResponse(String masterName) {
		this.masterName = masterName;
	}

	public boolean hasError() {
		return !errors.isEmpty();
	}

	/** 処理区分ごとの件数を 1 増やす */
	public void count(CsvOperation op) {
		switch (op) {
		case INSERT -> insertCount++;
		case UPDATE -> updateCount++;
		case DELETE -> deleteCount++;
		case HIDE -> hideCount++;
		case SHOW -> showCount++;
		}
	}
}
